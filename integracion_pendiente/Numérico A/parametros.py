class Parametros:
    def __init__(self, m, n, sigma, r, Delta, cA, cH):
        
        self.m = m
        self.n = n
        self.sigma = sigma
        self.r = r
        self.Delta = Delta
        self.cA = cA
        self.cH = cH
        
        self.R = self.r * self.n
        self.M = self.m * self.Delta

# Diccionario con lso 3 regimenes
REGIMENES = {
    "coexistencia": Parametros(m=20, n=100, sigma=0.5, r=1, Delta=3, cA=2, cH=2),
    "colapso":      Parametros(m=20, n=100, sigma=0.5, r=1, Delta=1, cA=10, cH=2),
    "frontera":     Parametros(m=1, n=10, sigma=0.5, r=0.12, Delta=10, cA=1, cH=1)
}