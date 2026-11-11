# Cómo contribuir

Reglas mínimas para que ocho personas trabajen en un solo repositorio sin pisarse.

## Flujo

1. **Abre un issue** con la plantilla «Tarea» si lo que vas a hacer no está ya en el tablero.
2. **Crea una rama** desde `main` actualizado:

   ```bash
   git switch main && git pull
   git switch -c feat/seccion3-bifurcaciones
   ```

3. **Trabaja en tu archivo**, no en el de otro. Si necesitas cambiar algo ajeno, avisa en el PR.
4. **Regenera lo que corresponda**:

   ```bash
   python tools/figs.py
   python -m pytest -q
   ```

5. **Abre el Pull Request** a `main`, con la plantilla. Una persona revisora de **otro bloque**.
6. Al aprobar y pasar CI, se hace *squash merge* y se borra la rama.

## Nombres de rama

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feat/` | contenido nuevo | `feat/seccion4-cuencas` |
| `fix/` | corrección de un error | `fix/eigenvalor-frontera` |
| `docs/` | texto, redacción, figuras del informe | `docs/discusion-ia` |
| `fig/` | solo regenerar figuras | `fig/mapa-regimenes` |
| `chore/` | infraestructura, CI, plantillas | `chore/gitignore` |

## Commits

Un commit = un cambio con sentido. Prefijo obligatorio:

```text
feat(seccion3): demuestra que x* > sigma equivale al umbral
fix(tools): corrige el signo del término y/x
docs(modelo): redacta los pagos del caso x < sigma
fig(cuencas): regenera con malla 200x200
```

## Qué NO se sube

- Entornos virtuales, `__pycache__`, archivos temporales de Office (`~$*.docx`).
- PDFs intermedios y capturas sueltas: solo el informe y las figuras finales.
- Datos personales de terceros o material con derechos de autor.

## Antes de pedir revisión

- [ ] `python -m pytest -q` pasa.
- [ ] Las figuras se regeneran con el script (no hay PNG editados a mano).
- [ ] El texto cita las figuras y tablas por número.
- [ ] Mis cambios no tocan archivos de otro bloque sin avisar en el PR.
