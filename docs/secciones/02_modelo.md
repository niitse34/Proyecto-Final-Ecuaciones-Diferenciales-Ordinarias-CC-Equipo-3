> **Responsables:** @usuario2 (oferta) y @usuario3 (demanda) · **Revisa:** @usuario4 · **Estado:** pendiente
> **Extensión objetivo:** 2,0 páginas · **Cuestiones:** C1.1 – C1.7

# 2. Modelo

## 2.1 Agentes y estrategias

| Población | Tamaño | Estrategia | Costo | Resultado |
|-----------|--------|------------|-------|-----------|
| Productores | m | H (alto esfuerzo) | c_H | calidad b_H |
| Productores | m | L (bajo esfuerzo) | 0 | calidad b_L |
| Consumidores | n | A (búsqueda activa) | c_A | elige calidad |
| Consumidores | n | P (pasivo) | 0 | muestrea al azar |

## 2.2 La restricción de atención

<!-- σ ∈ (0,1): fracción de ítems que cada consumidor puede atender. Explicar por qué σ(1−σ)
     mide la discriminabilidad y por qué se maximiza en σ = 1/2 (cuestión C1.6). -->

## 2.3 Pagos — Caso 1: x ≥ σ

<!-- Contar vistas: pasivas (σ) + activas (σ/x). Escribir π_H y π_L, luego π_A y π_P.
     Cuestión C1.1. -->

```
π_H = −c_H + r n σ[(1−y) + y/x]        π_L = r n σ(1−y)
π_A = −c_A + m σ b_H                    π_P = σ m[x b_H + (1−x) b_L]
```

## 2.4 Pagos — Caso 2: x < σ

<!-- Los activos consumen todo lo de calidad y rellenan con baja calidad: factor (σ−x)/(1−x).
     Cuestión C1.2. -->

## 2.5 El sistema replicador

```
x′ = x(1−x)·Δπ_H,        y′ = y(1−y)·Δπ_A
```

<!-- Justificar la forma replicadora, la invariancia de [0,1]² y la continuidad (no C¹) en x = σ.
     Cuestiones C1.3 y C1.4. -->

## 2.6 Parámetros y adimensionalización

<!-- Tabla de parámetros (C1.7) y los dos grupos adimensionales:

       A = c_A / (m σ Δ),      B = r n σ / c_H,      Δ = b_H − b_L   (C1.5) -->

---

### Checklist

- [ ] Cada término de los pagos está justificado, no solo escrito.
- [ ] Se explica el factor `y/x` y el factor `(σ−x)/(1−x)`.
- [ ] Está dicha la invariancia de `[0,1]²` y la no-suavidad en `x = σ`.
- [ ] Los símbolos coinciden con `replicador_atencion.py`.
