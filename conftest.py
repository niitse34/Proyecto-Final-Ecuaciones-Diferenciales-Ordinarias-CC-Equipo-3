"""Deja el directorio raíz del repositorio en sys.path para poder importar el modelo."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
