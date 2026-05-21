"""Unit tests for Task 3 transform + HTML rendering."""
from __future__ import annotations

import sys
from decimal import Decimal
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from task3_transform_and_print import (  # noqa: E402
    Order,
    OrderHeader,
    OrderLine,
    parse_order_input,
    render_invoice_html,
)


TEMPLATE = Path(__file__).resolve().parent.parent / "templates" / "03_Task3_Order_Print_Template.xls"


def test_line_total_no_discount():
    l = OrderLine(sku="A", name="A", qty=Decimal(2), price=Decimal(350), discount_pct=Decimal(0))
    assert l.line_total == Decimal("700.00")


def test_line_total_with_discount():
    l = OrderLine(sku="A", name="A", qty=Decimal(1), price=Decimal(900), discount_pct=Decimal(10))
    assert l.line_total == Decimal("810.00")


def test_order_total_sums_lines():
    order = Order(
        header=OrderHeader("SO-1", "2026-01-01", "Acme", "123", "RUB"),
        lines=[
            OrderLine("A", "A", Decimal(2), Decimal(350), Decimal(0)),
            OrderLine("B", "B", Decimal(1), Decimal(900), Decimal(10)),
        ],
    )
    assert order.total == Decimal("1510.00")


def test_parse_order_input_from_template():
    order = parse_order_input(TEMPLATE)
    assert order.header.order_no == "SO-0001"
    assert order.header.customer_inn == "7701234567"
    assert order.header.currency == "RUB"
    assert len(order.lines) == 2
    assert order.total == Decimal("1510.00")


@pytest.fixture
def sample_order():
    return Order(
        header=OrderHeader("SO-0001", "2026-02-13", "ООО Ромашка", "7701234567", "RUB"),
        lines=[
            OrderLine("TSH-001", "Футболка белая", Decimal(2), Decimal(350), Decimal(0)),
            OrderLine("BAG-001", "Сумка тканевая", Decimal(1), Decimal(900), Decimal(10)),
        ],
    )


def test_invoice_html_contains_header_and_total(sample_order):
    html = render_invoice_html(sample_order)
    assert "SO-0001" in html
    assert "2026-02-13" in html
    assert "ООО Ромашка" in html
    assert "7701234567" in html
    assert "1510.00" in html
    assert "RUB" in html


def test_invoice_html_lists_all_lines(sample_order):
    html = render_invoice_html(sample_order)
    for l in sample_order.lines:
        assert l.sku in html
        assert l.name in html


def test_invoice_html_escapes_user_text():
    order = Order(
        header=OrderHeader("SO-1", "2026-01-01", "<script>alert(1)</script>", "111", "RUB"),
        lines=[OrderLine("X", "<b>X</b>", Decimal(1), Decimal(10), Decimal(0))],
    )
    out = render_invoice_html(order)
    assert "<script>" not in out
    assert "&lt;script&gt;" in out
    assert "&lt;b&gt;X&lt;/b&gt;" in out
