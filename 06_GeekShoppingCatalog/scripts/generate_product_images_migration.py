import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class CatalogProduct:
    file_name: str
    name: str
    description: str
    price: str
    old_price: Optional[str]
    category: str
    quantity: int
    featured: bool
    created_at: str
    color: Optional[str]
    size: Optional[str]
    popularity: int


CATALOG = [
    CatalogProduct("1_super_mario.jpg", "Caneca Super Mario Coffee",
                   "Caneca branca com a estampa Super Mario Coffee, com o cogumelo vermelho do jogo.",
                   "39.90", None, "Caneca", 45, True, "2026-10-01 10:00:00.000000", "White", None, 80),
    CatalogProduct("2_no_internet.jpg", "Camiseta No Internet",
                   "Camiseta preta com a estampa No Internet, inspirada no dinossauro do navegador.",
                   "69.90", None, "Camiseta", 30, False, "2026-10-02 10:00:00.000000", "Black", "M", 72),
    CatalogProduct("3_vader.jpg", "Capacete Darth Vader Star Wars Black Series",
                   "Capacete eletrônico premium do Darth Vader, da linha Star Wars The Black Series, da Hasbro.",
                   "999.99", None, "Boneco de ação", 0, False, "2026-10-03 10:00:00.000000", "Black", None, 150),
    CatalogProduct("4_storm_tropper.jpg", "Star Wars The Black Series Hasbro - Stormtrooper Imperial",
                   "Boneco do Stormtrooper Imperial, da linha Star Wars The Black Series, da Hasbro.",
                   "189.99", "229.99", "Boneco de ação", 12, True, "2026-10-04 10:00:00.000000", "White", None, 130),
    CatalogProduct("5_100_gamer.jpg", "Camiseta Gamer",
                   "Camiseta preta com a estampa Gamer 100% Classically Trained.",
                   "69.99", None, "Camiseta", 28, False, "2026-10-05 10:00:00.000000", "Black", "L", 64),
    CatalogProduct("6_spacex.jpg", "Camiseta SpaceX",
                   "Camiseta raglan branca com mangas pretas e o logotipo da SpaceX.",
                   "49.99", None, "Camiseta", 35, False, "2026-10-06 10:00:00.000000", "White", "XL", 58),
    CatalogProduct("7_coffee.jpg", "Camiseta Feminina Coffee Benefits",
                   "Camiseta feminina bege com a estampa Benefits of Drinking Coffee.",
                   "69.90", None, "Camiseta", 22, False, "2026-10-07 10:00:00.000000", "Beige", "S", 45),
    CatalogProduct("8_moletom_cobra_kay.jpg", "Moletom Com Capuz Cobra Kai",
                   "Moletom preto com capuz e a estampa do Cobra Kai.",
                   "159.90", "199.90", "Moletom", 15, True, "2026-10-08 10:00:00.000000", "Black", "L", 110),
    CatalogProduct("9_neil.jpg", "Livro Star Talk - Neil DeGrasse Tyson",
                   "Livro Star Talk, de Neil deGrasse Tyson, em parceria com a National Geographic.",
                   "49.90", None, "Livro", 40, True, "2026-10-09 10:00:00.000000", "Black", None, 90),
    CatalogProduct("10_milennium_falcon.jpg", "Star Wars Mission Fleet Han Solo Nave Millennium Falcon",
                   "Nave Millennium Falcon da linha Star Wars Mission Fleet, acompanhada da figura do Han Solo.",
                   "359.99", None, "Boneco de ação", 8, True, "2026-10-10 10:00:00.000000", "Gray", None, 140),
    CatalogProduct("11_mars.jpg", "Camiseta Elon Musk SpaceX Marte Occupy Mars",
                   "Camiseta preta com a estampa Occupy Mars.",
                   "59.99", "79.99", "Camiseta", 26, True, "2026-10-11 10:00:00.000000", "Black", "M", 85),
    CatalogProduct("12_gnu_linux.jpg", "Camiseta GNU Linux Programador Masculina",
                   "Camiseta branca com a estampa GNU/Linux Freedom.",
                   "59.99", None, "Camiseta", 31, False, "2026-10-12 10:00:00.000000", "White", "L", 70),
    CatalogProduct("13_dragon_ball.jpg", "Camiseta Goku Fases",
                   "Camiseta com a estampa de Goku em duas fases.",
                   "59.99", None, "Camiseta", 24, False, "2026-10-13 10:00:00.000000", "White", "S", 95),
    CatalogProduct("14_patch_nasa.jpg", "Patch NASA",
                   "Patch bordado da NASA.",
                   "24.90", None, "Acessório", 60, False, "2026-10-14 10:00:00.000000", "Blue", None, 40),
]

COLUMNS = [
    "name", "description", "price", "old_price", "category", "quantity", "featured",
    "created_at", "color", "size", "popularity", "image", "image_content_type", "image_size",
]
IGNORED_FILES = {"00_no_image.jpg"}
JPEG_SIGNATURE = b"\xff\xd8\xff"
CONTENT_TYPE = "image/jpeg"
VERSION_PATTERN = re.compile(r"^V(\d+)__.*\.sql$")
DEFAULT_DESCRIPTION = "Insert_Data_In_Products_Catalog"


def default_migrations_dir() -> Path:
    root = Path(__file__).resolve().parent.parent
    return root / "geek-shopping-api" / "src" / "main" / "resources" / "db" / "migration"


def next_version(migrations_dir: Path) -> int:
    versions = []
    for entry in migrations_dir.iterdir():
        match = VERSION_PATTERN.match(entry.name)
        if match:
            versions.append(int(match.group(1)))
    if not versions:
        raise SystemExit(f"No migrations found in {migrations_dir}")
    return max(versions) + 1


def sql_string(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def check_description_not_used(migrations_dir: Path, description: str) -> None:
    pattern = re.compile(rf"^V\d+__{re.escape(description)}\.sql$")
    for entry in migrations_dir.iterdir():
        if pattern.match(entry.name):
            raise SystemExit(f"A migration with this description already exists: {entry.name}")


def sql_nullable_string(value: Optional[str]) -> str:
    return "NULL" if value is None else sql_string(value)


def read_image(images_dir: Path, file_name: str) -> bytes:
    path = images_dir / file_name
    if not path.is_file():
        raise SystemExit(f"Missing image file: {path}")
    content = path.read_bytes()
    if not content.startswith(JPEG_SIGNATURE):
        raise SystemExit(f"Not a JPEG file: {path}")
    return content


def check_unmapped_files(images_dir: Path) -> None:
    mapped = {product.file_name for product in CATALOG}
    unmapped = sorted(
        entry.name for entry in images_dir.iterdir()
        if entry.is_file() and entry.name not in mapped and entry.name not in IGNORED_FILES
    )
    if unmapped:
        raise SystemExit("Files without a product mapping: " + ", ".join(unmapped))


def build_statement(product: CatalogProduct, content: bytes) -> str:
    values = [
        sql_string(product.name),
        sql_string(product.description),
        product.price,
        "NULL" if product.old_price is None else product.old_price,
        sql_string(product.category),
        str(product.quantity),
        "b'1'" if product.featured else "b'0'",
        sql_string(product.created_at),
        sql_nullable_string(product.color),
        sql_nullable_string(product.size),
        str(product.popularity),
        "X'" + content.hex().upper() + "'",
        sql_string(CONTENT_TYPE),
        str(len(content)),
    ]
    columns = ", ".join(f"`{column}`" for column in COLUMNS)
    return f"INSERT INTO `products` ({columns}) VALUES ({', '.join(values)});"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generates the next Flyway migration (pure SQL) that inserts the product catalog with the images stored as blobs."
    )
    parser.add_argument("images_dir", type=Path, help="Folder with the product image files")
    parser.add_argument("--migrations-dir", type=Path, default=default_migrations_dir(),
                        help="Flyway migrations folder (default: geek-shopping-api/src/main/resources/db/migration)")
    parser.add_argument("--description", default=DEFAULT_DESCRIPTION,
                        help="Description part of the migration file name")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate the images and print the summary without writing the migration")
    arguments = parser.parse_args()

    images_dir = arguments.images_dir
    migrations_dir = arguments.migrations_dir
    if not images_dir.is_dir():
        raise SystemExit(f"Images folder not found: {images_dir}")
    if not migrations_dir.is_dir():
        raise SystemExit(f"Migrations folder not found: {migrations_dir}")

    check_unmapped_files(images_dir)
    check_description_not_used(migrations_dir, arguments.description)

    statements = []
    total_bytes = 0
    for product in CATALOG:
        content = read_image(images_dir, product.file_name)
        statements.append(build_statement(product, content))
        total_bytes += len(content)
        print(f"{product.file_name:<28} {len(content):>9} bytes  ->  {product.name}")

    version = next_version(migrations_dir)
    target = migrations_dir / f"V{version}__{arguments.description}.sql"
    if target.exists():
        raise SystemExit(f"Refusing to overwrite an existing migration: {target}")

    print(f"\n{len(statements)} products, {total_bytes} bytes of images")
    print(f"Target: {target}")

    if arguments.dry_run:
        print("Dry run: nothing was written")
        return 0

    target.write_text("\n".join(statements) + "\n", encoding="utf-8", newline="\n")
    print(f"Written: {target} ({target.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
