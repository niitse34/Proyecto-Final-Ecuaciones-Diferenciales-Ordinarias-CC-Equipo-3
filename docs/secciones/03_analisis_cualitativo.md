> **Responsables:** @usuario4 (equilibrios) y @usuario5 (bifurcaciones) · **Revisa:** @usuario5 · **Estado:** pendiente
> **Extensión objetivo:** 2,6 páginas · **Cuestiones:** C2.1 – C2.6, C3.1 – C3.8

# 3. Análisis cualitativo

## 3.1 Soluciones exactas en los bordes

<!-- y = 1: x′ = (1−x)(r n σ − c_H x) → integrar por fracciones simples (C2.1).
     y = 0, x = 1, x = 0: logísticas (C2.2).
     Cerrar con el argumento de por qué no hay solución cerrada en el interior (C2.3). -->

## 3.2 Equilibrios

| Equilibrio | (x*, y*) | Eigenvalores | Tipo |
|------------|----------|--------------|------|
| Colapso | (0, 0) | −c_H, −c_A | nodo estable (siempre) |
| Frontera | (r n σ/c_H, 1) | r n σ − c_H, c_A − m σ Δ(1−x_b) | nodo si ambos < 0 |
| Interior | (1 − c_A/(m σ Δ), …) | tr y det abajo | foco/nodo estable si x* > σ |
| Silla (x < σ) | (c_A/(m(1−σ)Δ), …) | signos opuestos | silla |

<!-- Completar con las esquinas (C3.1) y escribir los jacobianos (C2.4–C2.6):

     tr J = −c_H(1 − 2x*) − r n σ y*
     det J = m σ² Δ r n (1 − x*) y* (1 − y*) -->

## 3.3 Los umbrales son condiciones de localización

<!-- Cuestión C3.2, el resultado central del informe:

       m σ(1−σ)Δ > c_A   ⟺   x* > σ
       c_A/(m σ Δ) + r n σ/c_H > 1   ⟺   y* < 1 -->

## 3.4 Bifurcaciones

<!-- C3.3: pliegue no suave en c_A = m σ(1−σ)Δ; el equilibrio se aniquila en (σ, c_H/(r n)) y el
     campo es tangente a x = σ. Salto discontinuo de x*.
     C3.4: transcrítica en y = 1; x* = x_b e intercambio de estabilidad.
     Figuras: fig4_bifurcacion.png y fig5_mapa.png. -->

## 3.5 Cuencas y bistabilidad

<!-- C3.6 y C3.7: el origen siempre atrae; la variedad estable de la silla organiza la frontera.
     Figura: fig3_cuencas.png. Discutir la sensibilidad a la condición inicial. -->

---

### Checklist

- [ ] Cada condición de estabilidad está **demostrada**, no copiada del artículo.
- [ ] Están los cinco equilibrios, incluidas las esquinas.
- [ ] Las dos bifurcaciones están nombradas y ubicadas en el plano de parámetros.
- [ ] Los números coinciden con el anexo A de la guía y con `pytest`.
