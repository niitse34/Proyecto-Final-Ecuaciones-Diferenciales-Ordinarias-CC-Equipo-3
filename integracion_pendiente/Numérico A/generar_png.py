import os
from tablas_errores import generar_tabla_error, generar_tabla_costo_precision
from regimenes import generar_regimenes

def main():
    os.makedirs("resultados", exist_ok=True)

    generar_tabla_error()
    generar_tabla_costo_precision()
    generar_regimenes()

if __name__ == "__main__":
    main()