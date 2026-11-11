"""Verificación numérica de los resultados del Anexo A de la guía.

Cada prueba corresponde a un resultado que el informe debe demostrar a mano.
Si alguien cambia el modelo y estas pruebas fallan, el texto quedó desactualizado.
"""
import numpy as np
import pytest

from replicador_atencion import Params, clasificar, equilibrios, jacobiano, rhs

COEX = Params(m=20, n=100, sigma=0.5, r=1.0, d_b=3.0, cA=2.0, cH=2.0)
FRON = Params(m=1, n=10, sigma=0.5, r=0.12, d_b=10.0, cA=1.0, cH=1.0)
COLA = Params(m=20, n=100, sigma=0.5, r=1.0, d_b=1.0, cA=10.0, cH=2.0)


def buscar(p, prefijo):
    for nombre, x, y, _ in equilibrios(p):
        if nombre.startswith(prefijo):
            return x, y
    raise AssertionError("no hay equilibrio que empiece por %r" % prefijo)


def test_regimenes():
    assert COEX.regimen == "coexistencia"
    assert FRON.regimen == "frontera"
    assert COLA.regimen == "colapso"


def test_equilibrio_de_coexistencia():
    x, y = buscar(COEX, "coexistencia")
    assert x == pytest.approx(1 - COEX.cA / (COEX.m * COEX.sigma * COEX.d_b), rel=1e-12)
    assert x == pytest.approx(0.9333, abs=1e-4)
    assert y == pytest.approx(0.03733, abs=1e-5)


def test_eigenvalores_del_foco():
    x, y = buscar(COEX, "coexistencia")
    ev = np.linalg.eigvals(jacobiano(x, y, COEX))
    assert ev.real.max() == pytest.approx(-0.0667, abs=1e-3)
    assert abs(ev.imag[0]) == pytest.approx(1.8946, abs=1e-3)


def test_equilibrio_de_frontera():
    x, y = buscar(FRON, "frontera")
    assert (x, y) == (pytest.approx(0.6), pytest.approx(1.0))
    ev = np.sort(np.linalg.eigvals(jacobiano(x, y, FRON)).real)
    assert ev[0] == pytest.approx(-1.0, abs=1e-6)
    assert ev[1] == pytest.approx(-0.4, abs=1e-6)


def test_origen_siempre_estable():
    for p in (COEX, FRON, COLA):
        ev = np.linalg.eigvals(jacobiano(1e-9, 1e-9, p)).real
        assert ev.max() < 0


def test_continuidad_en_la_frontera():
    """El campo es continuo en x = sigma aunque no sea diferenciable."""
    eps = 1e-9
    for y in (0.1, 0.4, 0.9):
        izq = rhs(0.0, np.array([COEX.sigma - eps, y]), COEX)
        der = rhs(0.0, np.array([COEX.sigma + eps, y]), COEX)
        assert np.allclose(izq, der, atol=1e-6)


def test_invariancia_del_cuadrado():
    p = COEX
    for y in (0.25, 0.75):
        for x0 in (0.0, 1.0):
            assert rhs(0.0, np.array([x0, y]), p)[0] == pytest.approx(0.0, abs=1e-12)
    for x in (0.25, 0.75):
        for y0 in (0.0, 1.0):
            assert rhs(0.0, np.array([x, y0]), p)[1] == pytest.approx(0.0, abs=1e-12)


def test_pliegue_no_suave():
    """En c_A = m·sigma·(1-sigma)·db el equilibrio interior cae sobre x = sigma.

    El punto de aniquilación es (sigma, cH/(r n)) y allí el campo se anula.
    """
    p = Params(m=20, n=100, sigma=0.5, r=1.0, d_b=3.0, cA=15.0, cH=2.0)
    x, y = buscar(p, "coexistencia")
    assert x == pytest.approx(p.sigma, abs=1e-12)
    assert y == pytest.approx(p.cH / (p.r * p.n), abs=1e-12)
    assert np.allclose(rhs(0.0, np.array([x, y]), p), [0.0, 0.0], atol=1e-12)


def test_umbral_equivale_a_localizacion():
    """m·sigma·(1-sigma)·db > cA  <=>  x* > sigma."""
    for cA in (1.0, 5.0, 14.0, 16.0):
        p = Params(m=20, n=100, sigma=0.5, r=1.0, d_b=3.0, cA=cA, cH=2.0)
        x_star = 1 - p.cA / (p.m * p.sigma * p.d_b)
        assert (p.discriminacion > p.cA) == (x_star > p.sigma)
