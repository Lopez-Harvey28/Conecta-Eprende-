# Design System

## Direction

Interfaz de producto clara y práctica, pensada para uso diurno en teléfonos y computadoras de negocios pequeños. La identidad local se expresa mediante lenguaje y datos reales, no decoración folclórica.

## Color

- Primario: azul profundo `#001F3F`, usado en navegación global, encabezados principales y elementos de marca.
- Secundario: gris plata `#C0C0C0`, usado en bordes, separadores, contornos y estados inactivos.
- Terciario: azul corporativo intermedio `#004080`, reservado para llamadas a la acción, botones primarios y enlaces activos.
- Neutro: gris muy claro `#F5F5F5`, usado como fondo principal para reducir fatiga visual y mantener la interfaz limpia.
- Superficie: `#fbfbfb`, una variación mínima del neutro para diferenciar tarjetas y formularios sin introducir una nueva familia cromática.
- Estados de error: rojo terroso `oklch(52% .16 28)`, conservado solo para accesibilidad y comunicación de errores.

## Typography

Inter o Segoe UI con escala compacta de producto. Títulos usan peso y contraste, no tipografía decorativa. El cuerpo se limita a aproximadamente 70 caracteres cuando es prosa.

## Components

Botones de 42 px mínimos, radio de 10 px y foco visible. Badges separan confianza, verificación, estado de perfil y disponibilidad. Las superficies se agrupan solo cuando representan una unidad funcional. Estados vacíos explican el siguiente paso; limitaciones del MVP siempre incluyen una razón.

## Layout and Motion

Navegación superior en escritorio y menú plegable en móvil. Búsqueda usa filtros, resultados y contexto geográfico en escritorio; móvil prioriza consulta y resultados. Transiciones de 180 ms, sin animaciones decorativas y con soporte para movimiento reducido.
