#!/usr/bin/env python3
"""Pesquisa conservadora de candidatos a coordenadas na WRAM de save states Snes9x.

Não contém ROM, saves ou gráficos de The 7th Saga. Não identifica colisões
nem coordenadas do mundo apenas pela igualdade entre dois estados.
Uso: python3 analisar_movimento_frz.py A.frz B.frz [C.frz ...] --out analise.json
     python3 analisar_movimento_frz.py --self-test
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import sys
import unittest
from pathlib import Path

RAM_SIZE = 128 * 1024
MAX_FILE_SIZE = 32 * 1024 * 1024
CAMERA_ADDRESSES = (0x0030, 0x1D11)  # espelhos observados na fase 26
HEADER = re.compile(rb"^#!(?:s9xsnp|snes9x):[0-9]{4}\n")


class InvalidSnapshot(ValueError):
    """Save state incompleto, malformado ou não suportado."""


def unpack_snapshot_bytes(content: bytes) -> dict[str, bytes]:
    """Retorna blocos nomeados de um snapshot Snes9x, com limites de tamanho."""
    if len(content) > MAX_FILE_SIZE:
        raise InvalidSnapshot("Arquivo excede o limite de tamanho")
    if content.startswith(b"\x1f\x8b"):
        try:
            content = gzip.decompress(content)
        except (EOFError, OSError) as exc:
            raise InvalidSnapshot("Gzip inválido") from exc
        if len(content) > MAX_FILE_SIZE:
            raise InvalidSnapshot("Snapshot descomprimido excede o limite")
    match = HEADER.match(content)
    if not match:
        raise InvalidSnapshot("Assinatura Snes9x desconhecida")
    cursor = match.end()
    blocks: dict[str, bytes] = {}
    while cursor < len(content):
        if len(content) - cursor < 11:
            raise InvalidSnapshot("Cabeçalho de bloco incompleto")
        head = content[cursor:cursor + 11]
        if head[3:4] != b":" or head[10:11] != b":" or not head[4:10].isdigit():
            raise InvalidSnapshot("Cabeçalho de bloco inválido")
        try:
            name = head[:3].decode("ascii")
        except UnicodeDecodeError as exc:
            raise InvalidSnapshot("Nome de bloco inválido") from exc
        size = int(head[4:10])
        cursor += 11
        if size > MAX_FILE_SIZE or cursor + size > len(content):
            raise InvalidSnapshot("Bloco incompleto ou grande demais: " + name)
        if name in blocks:
            raise InvalidSnapshot("Bloco duplicado: " + name)
        blocks[name] = content[cursor:cursor + size]
        cursor += size
    if len(blocks.get("RAM", b"")) != RAM_SIZE:
        raise InvalidSnapshot("Bloco RAM de 128 KiB ausente ou incorreto")
    return blocks


def parse_snapshot(path: Path) -> dict:
    raw = path.read_bytes()
    blocks = unpack_snapshot_bytes(raw)
    return {
        "name": path.name,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "ram": blocks["RAM"],
        "block_names": sorted(blocks),
    }


def u16(memory: bytes, offset: int) -> int:
    return memory[offset] | (memory[offset + 1] << 8)


def find_camera_candidates(snapshots: list[dict], limit: int = 128) -> dict:
    """Acha valores LE16 com deslocamento relativo CONSTANTE à câmera.

    Igualdade de delta não demonstra identidade do jogador ou colisão.
    Endereços são da WRAM (banco $7E), não posições de mapa.
    """
    if len(snapshots) < 2:
        raise ValueError("São necessários pelo menos dois snapshots")
    memories = [s["ram"] for s in snapshots]
    if any(len(ram) != RAM_SIZE for ram in memories):
        raise ValueError("Tamanho de WRAM inesperado")
    observed_cameras = [[u16(r, offset) for r in memories] for offset in CAMERA_ADDRESSES]
    if any(c != observed_cameras[0] for c in observed_cameras[1:]):
        raise ValueError("Espelhos de câmera não coincidem; não usar esta referência")
    cameras = observed_cameras[0]
    deltas = [((n - cameras[0]) & 0xFFFF) for n in cameras]
    excluded = {address + j for address in CAMERA_ADDRESSES for j in (-1, 0, 1)}
    ranked = []
    for offset in range(RAM_SIZE - 1):
        if offset in excluded:
            continue
        values = [u16(r, offset) for r in memories]
        relative = [(value - cam) & 0xFFFF for value, cam in zip(values, cameras)]
        if len(set(relative)) != 1:
            continue
        if len(set(values)) <= 1:
            continue  # um valor parado NÃO acompanhou a câmera
        ranked.append({
            "wram_offset_hex": f"7E:{offset:04X}",
            "offset_decimal": offset,
            "relative_to_camera_u16": relative[0],
            "observed_le16": values,
            "aligned": offset % 2 == 0,
            "status": "correlacao_apenas",
        })
    ranked.sort(key=lambda d: (not d["aligned"], d["offset_decimal"]))
    return {
        "snapshots": [
            {"name": s["name"], "sha256": s["sha256"]} for s in snapshots
        ],
        "camera_reference_offsets": [f"7E:{a:04X}" for a in CAMERA_ADDRESSES],
        "camera_values": cameras,
        "camera_delta_mod_65536": deltas,
        "distinct_camera_values": len(set(cameras)),
        "candidate_count_total": len(ranked),
        "candidates_shown": ranked[:max(0, limit)],
        "evidence_level": (
            "multi_snapshot_correlation_only"
            if len(snapshots) >= 3 and len(set(cameras)) >= 2
            else "weak_two_snapshot_correlation_only"
        ),
        "limitations": [
            "O espelho da câmera não é necessariamente a coordenada do jogador.",
            "Dois estados não demonstram colisão, velocidade ou malha de passos.",
            "Offsets em regiões diferentes podem ser cópias de rolagem/VRAM.",
            "O rastreador não identifica coordenadas absolutas de mundo.",
        ],
    }


def _synthetic_state(camera: int, player_copy: int, distractor: int) -> bytes:
    memory = bytearray(RAM_SIZE)
    for offset in CAMERA_ADDRESSES:
        memory[offset:offset + 2] = camera.to_bytes(2, "little")
    memory[0x0240:0x0242] = player_copy.to_bytes(2, "little")
    memory[0x0300:0x0302] = distractor.to_bytes(2, "little")
    return b"#!s9xsnp:0012\n" + b"RAM:131072:" + bytes(memory)


class SnapshotTests(unittest.TestCase):
    def test_blocks_and_gzip(self):
        data = _synthetic_state(208, 320, 100)
        for src in (data, gzip.compress(data)):
            blocks = unpack_snapshot_bytes(src)
            self.assertEqual(u16(blocks["RAM"], 0x0030), 208)
        self.assertRaises(InvalidSnapshot, unpack_snapshot_bytes, b"invalid")

    def test_truncation_and_duplicate(self):
        data = _synthetic_state(208, 320, 100)
        self.assertRaises(InvalidSnapshot, unpack_snapshot_bytes, data[:-1])
        self.assertRaises(InvalidSnapshot, unpack_snapshot_bytes, data + data[14:])

    def test_camera_correlations(self):
        samples = []
        for i, cam in enumerate((208, 240, 368)):
            blocks = unpack_snapshot_bytes(_synthetic_state(
                cam, cam + 112, 50 + 3 * i
            ))
            samples.append({
                "name": str(i), "sha256": str(i), "ram": blocks["RAM"]
            })
        report = find_camera_candidates(samples)
        offsets = {x["offset_decimal"] for x in report["candidates_shown"]}
        self.assertIn(0x0240, offsets)
        self.assertNotIn(0x0300, offsets)
        self.assertNotIn(0x0030, offsets)
        self.assertEqual(report["camera_delta_mod_65536"], [0, 32, 160])

    def test_conflicting_camera_mirror(self):
        blocks = unpack_snapshot_bytes(_synthetic_state(208, 320, 100))
        modified = bytearray(blocks["RAM"])
        modified[0x1D11] ^= 1
        states = [
            {"name": "A", "sha256": "x", "ram": blocks["RAM"]},
            {"name": "B", "sha256": "y", "ram": bytes(modified)},
        ]
        self.assertRaises(ValueError, find_camera_candidates, states)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshots", nargs="*", type=Path)
    parser.add_argument("--out", type=Path, help="Destino JSON, sem memória bruta")
    parser.add_argument("--limit", type=int, default=128)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(SnapshotTests)
        return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1
    if len(args.snapshots) < 2:
        parser.error("Forneça dois ou mais arquivos .frz")
    try:
        report = find_camera_candidates(
            [parse_snapshot(p) for p in args.snapshots], args.limit
        )
    except (OSError, ValueError) as exc:
        parser.exit(2, "Erro: " + str(exc) + "\n")
    result = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.write_text(result, encoding="utf-8")
    else:
        sys.stdout.write(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
