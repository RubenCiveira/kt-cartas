// «¿Salió bien?», justo después de mandar a imprimir.
//
// El apunte de qué tienes en papel solo sirve si es fiable, y las dos maneras
// obvias de llevarlo fallan por lados distintos: apuntarlo a mano se olvida
// —que es justo por lo que no sabes qué versión tienes—, y apuntarlo solo al
// pulsar «Imprimir» registra también las tiradas que cancelas en el diálogo del
// navegador, o las que salen atascadas. Ninguna de las dos cosas la puede saber
// la página: `window.print()` no dice si se imprimió.
//
// Así que se pregunta. Un clic más por tirada, y el registro dice la verdad.

export default function ConfirmarImpresion({ nombre, version, cuantas, completa, onSi, onNo }) {
  return (
    <div className="modal-fondo" onClick={onNo}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>¿Ha salido bien?</h2>
        </div>

        <p className="parrafo">
          Si el papel está bien, se apunta que tienes impresa{" "}
          {completa ? <>la baraja <b>{nombre}</b> entera</> : <>{cuantas} carta(s) de <b>{nombre}</b></>}
          {version ? <> en la versión <b>{version}</b></> : null}. Es lo que luego contesta a «¿esto
          está al día?» cuando salga una errata.
        </p>

        <div className="modal-pie">
          <button className="btn btn-mini" onClick={onNo}>
            No apuntarlo
          </button>
          <button className="btn btn-primario" onClick={onSi}>
            Sí, apuntar
          </button>
        </div>
      </div>
    </div>
  );
}
