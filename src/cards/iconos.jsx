// Iconos de arquetipo basados en los emblemas oficiales (siluetas monocromas).


export const CALAVERA = (
  <>
    <path
      fillRule="evenodd"
      d="M12 2.5a6.5 6.5 0 00-6.5 6.5c0 2 .9 3.3 2 4.2.5.4.8 1 .8 1.6v1.4h7.4v-1.4c0-.6.3-1.2.8-1.6 1.1-.9 2-2.2 2-4.2A6.5 6.5 0 0012 2.5zM9.4 8.2a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4zm5.2 0a1.7 1.7 0 110 3.4 1.7 1.7 0 010-3.4zM12 11.6l1.2 2.2h-2.4z"
    />
    <rect x="8.9" y="16.9" width="1.6" height="2.4" rx="0.5" />
    <rect x="11.2" y="16.9" width="1.6" height="2.9" rx="0.5" />
    <rect x="13.5" y="16.9" width="1.6" height="2.4" rx="0.5" />
  </>
);

// Iconos de arquetipo basados en los emblemas oficiales (siluetas monocromas)
export const ICONOS_ARQ = {
  recon: (
    <>
      <g transform="rotate(-28 12 16)">
        <path d="M0.8 16l4.3-1.8h12.4a0.9 0.9 0 01.9.9v1.8a0.9 0.9 0 01-.9.9H5.1z" />
        <rect x="18.6" y="13.1" width="1.5" height="5.8" rx="0.7" />
        <rect x="20.3" y="15.1" width="3" height="1.8" rx="0.9" />
      </g>
      <g transform="translate(3.1 -0.6) scale(0.74)">{CALAVERA}</g>
    </>
  ),
  seguridad: (
    <>
      <path
        fillRule="evenodd"
        d="M12 1a11 11 0 100 22 11 11 0 000-22zm0 2.2a8.8 8.8 0 110 17.6 8.8 8.8 0 010-17.6z"
      />
      <path d="M12 3.9A8.1 8.1 0 0120.1 12H12z" />
      <path d="M12 20.1A8.1 8.1 0 013.9 12H12z" />
      <g transform="translate(-1.2 4.4) scale(0.64)">
        <g fill="#14181F" transform="translate(12 11) scale(1.28) translate(-12 -11)">{CALAVERA}</g>
        {CALAVERA}
      </g>
    </>
  ),
  infiltracion: (
    <>
      <path d="M2.5 12.5l9.5 8.3 9.5-8.3v-4l-9.5 8.3L2.5 8.5z" />
      <g transform="translate(3.6 -0.4) scale(0.7)">{CALAVERA}</g>
    </>
  ),
  buscar: (
    <>
      <g transform="rotate(32 12 17)">
        <path d="M1.5 17l3.6-1.5h16a0.8 0.8 0 01.8.8v1.4a0.8 0.8 0 01-.8.8H5.1z" />
      </g>
      <g transform="rotate(-32 12 17)">
        <path d="M22.5 17l-3.6-1.5h-16a0.8 0.8 0 00-.8.8v1.4a0.8 0.8 0 00.8.8h13.8z" />
      </g>
      <g transform="translate(3.6 -1) scale(0.7)">{CALAVERA}</g>
    </>
  ),
};


export function IconoArquetipo({ id, size = "3.4mm" }) {
  const icono = ICONOS_ARQ[id];
  if (!icono) return null;
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: "currentColor", flex: "0 0 auto" }}>
      {icono}
    </svg>
  );
}
