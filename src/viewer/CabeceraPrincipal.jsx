import MenuUsuario from "./MenuUsuario.jsx";

export default function CabeceraPrincipal({
  seccion, onBarajas, onOperadores, onMazosImpresion, mazosImpresion = 0,
  usuario, avatarUrl, onLogout, children,
}) {
  return (
    <header className="barra portada-barra">
      <div className="barra-fila">
        <h1 className="portada-marca">KT Cartas</h1>
        <nav className="chips" aria-label="Secciones principales">
          <button className={"chip" + (seccion === "barajas" ? " activa" : "")} aria-current={seccion === "barajas" ? "page" : undefined} onClick={onBarajas}>
            Barajas
          </button>
          <button className={"chip" + (seccion === "operadores" ? " activa" : "")} aria-current={seccion === "operadores" ? "page" : undefined} onClick={onOperadores}>
            Mis operadores
          </button>
        </nav>
        {children}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {onMazosImpresion && (
            <button className="btn btn-mini" onClick={onMazosImpresion}>
              Mazos de impresión{mazosImpresion ? ` (${mazosImpresion})` : ""}
            </button>
          )}
          <MenuUsuario usuario={usuario} avatarUrl={avatarUrl} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
