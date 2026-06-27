# Organizador de Eventos

Plataforma web de gestión e inscripción de eventos construida con **HTML, CSS y JavaScript puro** (sin frameworks, sin dependencias externas, sin pasos de build). Los datos viven en memoria y se reinician al recargar la página.

El proyecto modela un dominio de eventos con clases orientadas a objetos, encapsulación con campos privados (`#`), herencia, y una capa de presentación basada en manipulación del DOM y delegación de eventos.

---

## Tabla de contenidos

- [Características](#características)
- [Arquitectura general](#arquitectura-general)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Clases de JavaScript](#clases-de-javascript)
  - [`Event`](#event)
  - [`FeaturedEvent`](#featuredevent)
  - [`EventManager`](#eventmanager)
  - [`User`](#user)
  - [`UIManager`](#uimanager)
- [Funciones auxiliares](#funciones-auxiliares)
- [Patrones y técnicas destacadas](#patrones-y-técnicas-destacadas)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
- [Notas sobre los datos](#notas-sobre-los-datos)

---

## Características

- **Catálogo de eventos** con búsqueda por nombre o ubicación.
- **Filtrado por categoría** mediante chips interactivos.
- **Ordenamiento** por fecha, nombre o disponibilidad.
- **Inscripción y cancelación** a eventos con control de cupos.
- **Eventos destacados** con badge y texto de resaltado (herencia de `Event`).
- **Modal de detalles** implementado con `<dialog>` nativo de HTML.
- **Toast** para feedback de acciones (éxito, error, advertencia).
- **Accesibilidad**: roles ARIA, `aria-live`, foco gestionado en el modal, navegación por teclado.
- **Diseño responsive** con enfoque mobile-first.

---

## Arquitectura general

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Event     │◀────│ FeaturedEvent │     │   User      │
│  (dominio)  │     │  (herencia)   │     │ (inscripc.) │
└─────────────┘     └──────────────┘     └────────────┘
       ▲                                        ▲
       │ gestiona colección                     │ posee
       │                                        │
┌──────────────┐                         ┌──────────────┐
│ EventManager │◀──────── inyecta ───────│  UIManager   │
│  (filtros)   │     ──── inyecta ──────▶│  (vista/UI)  │
└──────────────┘                         └──────────────┘
                                                │
                                                ▼
                                         DOM (index.html)
```

- **Modelo de dominio**: `Event` y `FeaturedEvent` encapsulan los datos y reglas de negocio de un evento.
- **Gestión de colección**: `EventManager` administra la lista de eventos y aplica filtros y ordenamiento.
- **Estado del usuario**: `User` registra en qué eventos está inscrito el usuario actual.
- **Capa de presentación**: `UIManager` coordina el DOM, escucha eventos, renderiza vistas y delega acciones al modelo.

Las dependencias se inyectan por constructor (`UIManager` recibe `EventManager` y `User`), lo que desacopla la vista del modelo.

---

## Estructura de carpetas

```
parcial/
├── index.html              # Estructura del DOM y puntos de anclaje
├── css/
│   ├── main.css            # Punto de entrada de estilos (@imports)
│   ├── base/
│   │   ├── reset.css       # Normalización y reset
│   │   ├── tokens.css      # Variables de diseño (colores, espaciados)
│   │   └── animations.css  # Keyframes (modal, toast)
│   ├── components/
│   │   ├── modal.css       # Estilos del <dialog> modal
│   │   ├── event-card.css  # Tarjetas de evento
│   │   ├── toast.css       # Notificaciones
│   │   └── ...             # Otros componentes
│   └── layout/
│       ├── header.css
│       └── ...
└── js/
    └── app.js              # Toda la lógica: clases y arranque
```

---

## Clases de JavaScript

Todo el código vive en `js/app.js` bajo `"use strict"`. Las clases usan **campos privados nativos** (`#campo`), getters/setters y herencia con `extends`.

### `Event`

Clase base del dominio. Representa un evento al que los usuarios pueden inscribirse. Encapsula sus datos y reglas de negocio (cupos, fechas, registro).

#### Campos privados

| Campo             | Tipo     | Descripción                                              |
| ----------------- | -------- | -------------------------------------------------------- |
| `#id`             | `string` | Identificador único del evento                           |
| `#name`           | `string` | Nombre del evento (se normaliza con `trim()`)            |
| `#date`           | `string` | Fecha en formato `YYYY-MM-DD`                            |
| `#location`       | `string` | Lugar donde se realiza el evento                         |
| `#category`       | `string` | Categoría (Música, Deportes, Tecnología, etc.)           |
| `#capacity`       | `number` | Capacidad máxima                                     |
| `#registeredCount` | `number` | Número actual de inscritos                              |
| `#description`    | `string` | Descripción textual del evento                           |

#### Constructor

```js
constructor(data)
```

Recibe un objeto `data` con los campos del evento. **Valida** que existan `name`, `date`, `location` y `category`; lanza `Error` si falta alguno. Aplica `trim()` a `name` y `location`. Si no se indica `capacity` o `registeredCount`, usa valores por defecto (`100` y `0`).

#### Métodos

| Método                       | Descripción                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `getId()`                    | Devuelve el identificador del evento.                                                       |
| `getName()`                  | Devuelve el nombre del evento.                                                               |
| `getDate()`                  | Devuelve la fecha cruda (`YYYY-MM-DD`).                                                      |
| `getLocation()`              | Devuelve el lugar del evento.                                                                |
| `getCategory()`              | Devuelve la categoría del evento.                                                            |
| `getDescription()`           | Devuelve la descripción textual.                                                             |
| `getCapacity()`              | Devuelve la capacidad máxima.                                                                |
| `getRegisteredCount()`       | Devuelve la cantidad de inscritos actuales.                                                  |
| `setRegisteredCount(count)`  | Actualiza los inscritos. **Valida** que sea un número no negativo; lanza `Error` si no.     |
| `getAvailableSpots()`        | Calcula `capacity - registeredCount` (cupos disponibles).                                  |
| `isFull()`                   | Retorna `true` si `registeredCount >= capacity`.                                            |
| `isPastEvent()`              | Compara la fecha del evento con el día actual (a las 00:00) y devuelve `true` si ya pasó.   |
| `getCapacityPercentage()`    | Porcentaje de ocupación redondeado, acotado a `100`.                                        |
| `getDateFormatted()`         | Fecha larga localizada en español (`es-ES`) con día de la semana.                           |
| `getDateShort()`             | Devuelve `{ day, month }` con el día en dos dígitos y el mes abreviado en mayúsculas.        |
| `getCategoryConfig()`        | Resuelve el color/icono de la categoría desde `CATEGORY_CONFIG` (con fallback).             |
| `canRegister()`              | `true` si **no** está lleno **y** **no** es pasado.                                          |
| `register()`                 | Incrementa `registeredCount` en 1. Lanza `Error` si el evento está lleno o ya pasó.         |
| `cancelRegistration()`        | Decrementa `registeredCount` en 1. Lanza `Error` si no hay inscritos.                        |
| `getDetails()`               | Devuelve un objeto `plain` con los datos del evento. Lo sobrescribe `FeaturedEvent`.        |

> **Principio**: la validación de reglas de negocio vive en el modelo, no en la vista. La UI solo consulta métodos como `canRegister()` o `isFull()` para decidir qué mostrar.

---

### `FeaturedEvent`

Subclase de `Event` que representa un **evento destacado**. Añade un badge y un texto de resaltado, y sobrescribe `getDetails()` para exponer esa información extra.

```js
class FeaturedEvent extends Event { ... }
```

#### Campos privados adicionales

| Campo            | Tipo     | Descripción                                  |
| ---------------- | -------- | -------------------------------------------- |
| `#badgeLabel`    | `string` | Texto corto del badge (ej. "Plazas limitadas") |
| `#highlightText` | `string` | Texto de resaltado que aparece en el modal   |

#### Constructor

```js
constructor(data)
```

Llama a `super(data)` (valida los campos base) y luego asigna `badgeLabel` y `highlightText`. Si no se proporcionan, usa valores por defecto.

#### Métodos

| Método              | Descripción                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `getBadgeLabel()`   | Devuelve el texto del badge.                                           |
| `getHighlightText()`| Devuelve el texto de resaltado.                                        |
| `isFeatured()`      | Devuelve `true` (permite distinguir instancias por polimorfismo).      |
| `getDetails()`      | **Sobrescribe** al de `Event`: añade `isFeatured`, `badgeLabel` y `highlightText` al objeto retornado. |

> **Polimorfismo**: la UI trata `Event` y `FeaturedEvent` de forma uniforme llamando a `getDetails()`; el objeto devuelto ya contiene (o no) la información destacada, y la vista decide qué renderizar.

---

### `EventManager`

Gestiona la **colección de eventos** y aplica filtros y ordenamientos. Mantiene el estado de filtrado en `#filters`.

#### Campos privados

| Campo      | Tipo     | Descripción                                   |
| ---------- | -------- | --------------------------------------------- |
| `#events`  | `Event[]`| Arreglo de instancias de `Event`/`FeaturedEvent` |
| `#filters` | `Object` | `{ search, category, sort }` con valores por defecto |

#### Constructor

```js
constructor(events = [])
```

Guarda el arreglo de eventos. Inicializa `#filters` con `search: ""`, `category: "all"`, `sort: "date-asc"`.

#### Métodos

| Método                         | Descripción                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `addEvent(event)`              | Añade un evento a la colección. Valida que sea instancia de `Event`.                         |
| `getById(id)`                  | Busca un evento por `id`. Retorna el evento o `undefined`.                                  |
| `getAll()`                     | Devuelve una **copia** del arreglo de eventos.                                              |
| `getFeatured()`                | Filtra y retorna solo los eventos destacados (`FeaturedEvent`).                             |
| `getCategories()`              | Devuelve un arreglo **único** de categorías presentes (sin duplicados).                     |
| `setFilter(type, value)`       | Actualiza un filtro concreto (`search`, `category` o `sort`).                              |
| `getFilter(type)`              | Devuelve el valor actual de un filtro.                                                       |
| `clearFilters()`               | Restablece los filtros a sus valores por defecto.                                            |
| `getFilteredEvents()`          | **Pipeline**: aplica `search` → `category` → `sort` y devuelve los eventos resultantes.      |
| `#sortEvents(events, sortBy)`  | **Privado**. Ordena el arreglo según el criterio (`date-asc`, `date-desc`, `name-asc`, `name-desc`, `availability`). No muta el original. |
| `get count`                    | **Getter**. Devuelve la cantidad total de eventos.                                          |

#### Pipeline de filtrado (`getFilteredEvents`)

1. **Búsqueda**: filtra eventos cuyo `name` o `location` contienen el texto de `search` (case-insensitive).
2. **Categoría**: si la categoría activa no es `"all"`, filtra por coincidencia exacta.
3. **Ordenamiento**: delega en `#sortEvents` según el criterio seleccionado.

> **Inmutabilidad**: `getFilteredEvents` y `#sortEvents` operan sobre copias; el arreglo original `#events` nunca se muta al filtrar/ordenar.

---

### `User`

Representa al **usuario actual** y las inscripciones que posee. Mantiene un arreglo de IDs de eventos.

#### Campos privados

| Campo           | Tipo       | Descripción                              |
| --------------- | ---------- | ---------------------------------------- |
| `#name`         | `string`   | Nombre del usuario (por defecto `"Invitado"`) |
| `#registrations`| `string[]` | Arreglo de IDs de eventos inscritos      |

#### Constructor

```js
constructor(name = "Invitado")
```

#### Métodos

| Método                       | Descripción                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- |
| `getName()`                  | Devuelve el nombre del usuario.                                             |
| `isRegistered(eventId)`      | `true` si el `eventId` está en `#registrations`.                           |
| `register(eventId)`          | Añade el `eventId` a las inscripciones. **Lanza `Error` si ya está inscrito**. |
| `cancelRegistration(eventId)`| Elimina el `eventId`. **Lanza `Error` si no estaba inscrito**.              |
| `getRegistrations()`         | Devuelve una **copia** del arreglo de inscripciones.                       |
| `getRegistrationCount()`      | Devuelve la cantidad de inscripciones.                                     |

> `User` **no depende de `Event`**: trabaja solo con IDs. Esto evita acoplamiento y mantiene la responsabilidad dividida (validar cupos corresponde a `Event`, validar inscripción corresponde a `User`).

---

### `UIManager`

Es la capa de presentación. Recibe `EventManager` y `User` por **inyección de dependencias**, cachea los nodos del DOM, enlaza eventos y renderiza las vistas.

Es la clase más extensa: concentra toda la lógica de interacción con el DOM.

#### Campos privados

| Campo                  | Tipo       | Descripción                                                |
| ---------------------- | ---------- | ---------------------------------------------------------- |
| `#eventManager`        | `EventManager` | Referencia al gestor de eventos (inyectada)              |
| `#user`                | `User`     | Referencia al usuario actual (inyectada)                  |
| `#elements`            | `Object`   | Mapa de referencias del DOM cacheadas                     |
| `#lastFocusedElement`  | `Element\|null` | Último elemento con foco antes de abrir el modal     |

#### Constructor

```js
constructor(eventManager, user)
```

Asigna las dependencias inyectadas. No realiza trabajo pesado: la inicialización real ocurre en `init()`.

#### Ciclo de vida

```js
init()
```

Orquesta el arranque: cachea elementos, renderiza filtros/eventos/inscripciones, actualiza estadísticas y enlaza eventos.

#### Métodos privados de configuración

| Método             | Descripción                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `#cacheElements()` | Recupera y guarda en `#elements` todas las referencias del DOM mediante `getElementById`.    |
| `#bindEvents()`    | Registra todos los listeners de la aplicación (búsqueda, filtros, orden, modal, navegación, IntersectionObserver). |

**Listeners destacados en `#bindEvents`**:

- **Búsqueda** con debounce de 300 ms (`setTimeout`/`clearTimeout`) y reseteo de categoría.
- **Delegación de eventos** en `eventsGrid` y `registrationsList` mediante `data-action` y `data-event-id` para detectar clicks en botones dinámicos.
- **Modal nativo**: el `<dialog>` se cierra con el botón `×`, con clic en el **backdrop** (detectado comparando `getBoundingClientRect` con `clientX/clientY`), y con la tecla **Escape** (la maneja el navegador). La limpieza (`modalBody.innerHTML = ""` y restauración de foco) vive en el **evento `close`** del `<dialog>`, no en el método de cierre, porque el Escape nativo no invoca a `#closeModal()`.
- **IntersectionObserver** sobre las secciones para resaltar el enlace de navegación activo al hacer scroll.

#### Métodos privados de renderizado

| Método                   | Descripción                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `#renderCategoryFilters()`| Construye los chips de categoría a partir de `EventManager.getCategories()` y resalta el activo. |
| `#renderEvents()`         | Obtiene los eventos filtrados y los inyecta en `#events-grid` (vacío si no hay resultados).      |
| `#buildEventCard(event)`  | **Privado**. Devuelve el HTML de una tarjeta de evento (fecha, categoría, cupos, acciones).    |
| `#renderRegistrations()`  | Renderiza la lista de inscripciones del usuario en la sección "Mis Inscripciones".             |
| `#updateStats()`          | Actualiza los contadores de la hero (total de eventos, categorías, inscripciones del usuario).  |
| `#updateSearchClearButton(value)` | Muestra/oculta el botón de limpiar búsqueda según el valor del input.                    |

#### Métodos privados de acciones

| Método                      | Descripción                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `#handleRegister(eventId)`  | Inscribe al usuario: valida cupos, llama a `Event.register()` y `User.register()`, muestra toast y re-renderiza.  |
| `#handleCancel(eventId)`    | Cancela inscripción: decrementa el evento y elimina de `User`, muestra toast y re-renderiza.                       |
| `#openModal(eventId)`       | Abre el `<dialog>` con `showModal()`, inyecta el HTML del detalle y enlaza los botones de acción del modal.       |
| `#closeModal()`             | Cierra el `<dialog>` con `.close()`. La limpieza la hace el listener del evento `close`.                          |
| `#showToast(type, message)` | Crea y agrega un toast efímero (se elimina tras 3.5 s) en `#toast-container`.                                     |
| `#clearAllFilters()`        | Restablece filtros y re-renderiza toda la UI.                                                                     |
| `#closeMobileMenu()`        | Cierra el menú hamburguesa en mobile.                                                                              |
| `#setActiveNavLink(link)`   | Marca el enlace de navegación activo.                                                                             |

#### Flujo de inscripción (`#handleRegister`)

```
click en "Inscribirse"
    │
    ▼
#handleRegister(eventId)
    │
    ├─ event = eventManager.getById(eventId)
    ├─ validar event.canRegister()
    ├─ event.register()         // valida cupos (lanza Error si lleno/pasado)
    ├─ user.register(eventId)   // valida duplicado (lanza Error si ya inscrito)
    ├─ #showToast("success", ...)
    └─ #renderEvents() / #renderRegistrations() / #updateStats()
```

Si alguna validación lanza un error, se captura y se muestra un toast de error.

---

## Funciones auxiliares

### `seedEvents()`

Función libre (fuera de cualquier clase) que devuelve un arreglo con 12 eventos de ejemplo (algunos `Event`, otros `FeaturedEvent`) con datos realistas (Festival de Jazz, Hackathon IDAT, Maratón Costa Verde, etc.). Sirve como datos iniciales para inicializar el `EventManager`.

### Bloque de arranque (`DOMContentLoaded`)

```js
document.addEventListener("DOMContentLoaded", () => {
  const events = seedEvents();
  const eventManager = new EventManager(events);
  const user = new User("Invitado");
  const ui = new UIManager(eventManager, user);
  ui.init();
});
```

Construye el grafo de dependencias (modelo → gestor → usuario → UI) y arranca la aplicación cuando el DOM está listo.

### `CATEGORY_CONFIG`

Objeto constante que mapea nombres de categorías a su configuración visual (`color`, `colorDark`, `icon`). Las clases lo consultan vía `Event.getCategoryConfig()` con un **fallback** para categorías no listadas.

| Categoría   | Color    | Icono |
| ----------- | -------- | ----- |
| Música      | `#8B5CF6`| ♪     |
| Deportes    | `#F97316`| ⚽    |
| Tecnología  | `#3B82F6`| ⚡    |
| Gastronomía | `#EC4899`| 🍽    |
| Negocios    | `#14B8A6`| 💼    |
| Arte        | `#F59E0B`| 🎨    |

---

## Patrones y técnicas destacadas

### Encapsulación con campos privados (`#`)

Todas las clases usan **private fields nativos** de JavaScript (`#campo`), que son verdaderamente privados: no accesibles desde fuera ni por subclass. El acceso se hace exclusivamente por métodos (getters/setters). Refleja el principio de **ocultamiento de la información**.

### Herencia y polimorfismo

`FeaturedEvent extends Event` hereda toda la lógica de un evento y extiende el comportamiento con `isFeatured()` y redefiniendo `getDetails()`. La vista llama a `getDetails()` de forma uniforme y decide qué mostrar según la presencia de campos `isFeatured`/`badgeLabel`.

### Inyección de dependencias

`UIManager` no crea a `EventManager` ni a `User`: los recibe en el constructor. Esto desacopla la vista del modelo y facilita pruebas o sustituciones.

### Delegación de eventos

En vez de enlazar un listener por cada botón de tarjeta (que se renderizan dinámicamente), se usa **un solo listener** en el contenedor (`eventsGrid`) que detecta el botón clickado vía `e.target.closest("[data-action]")`. Es eficiente y evita re-enlazar tras cada re-render.

### Modal nativo (`<dialog>`)

Se usa el elemento `<dialog>` nativo con `showModal()`/`close()`:

- El navegador gestiona automáticamente el **trap de foco** y el cierre con **Escape**.
- El **backdrop** se estila con `::backdrop`.
- El clic fuera del modal se detecta comparando `getBoundingClientRect()` con las coordenadas del evento (porque `::backdrop` no es un event target).
- La **limpieza** (vaciar `modalBody.innerHTML` y restaurar foco) se ejecuta en el **evento `close`** del `<dialog>`, ya que `Escape` nativo cierra el diálogo sin pasar por `#closeModal()`.

### Debounce en la búsqueda

El input de búsqueda aplica un **debounce** de 300 ms (`setTimeout` + `clearTimeout`) para no filtrar en cada tecla y mejorar el rendimiento percibido.

### Validación de invariantes en el modelo

`Event`, `FeaturedEvent` y `User` lanzan `Error` cuando se viola una regla de dominio (cupos agotados, doble inscripción, cancelación sin inscripción previa). La UI captura estos errores y los convierte en feedback visual (toast).

### Inmutabilidad al filtrar

`getFilteredEvents` y `#sortEvents` no mutan el arreglo original `#events`: operan sobre copias y devuelven un nuevo arreglo.

---

## Cómo ejecutar el proyecto

No requiere build ni dependencias:

1. Clonar o copiar la carpeta del proyecto.
2. Abrir `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge, Safari).
3. Listo. Los datos se cargan desde `seedEvents()` al arrancar.

> Opcional: servir el proyecto con un servidor estático para evitar restricciones de `file://`:
>
> ```bash
> # Con Python 3
> python -m http.server 8000
>
> # Con Node (npx)
> npx serve
> ```
>
> Y abrir `http://localhost:8000`.

---

## Notas sobre los datos

- **Memoria volátil**: los eventos y las inscripciones viven en memoria. Al recargar la página se resetean a los valores de `seedEvents()`.
- **Sin persistencia**: no se usa `localStorage` ni `sessionStorage`. El alcance es didáctico.
- **Datos de ejemplo**: los eventos son ficticios y las categorías están preconfiguradas en `CATEGORY_CONFIG`.

---

## Resumen de responsabilidades

| Clase          | Rol                                                            | conoce a  |
| -------------- | ------------------------------------------------------------- | -------- |
| `Event`        | Entidad de dominio: datos y reglas de un evento               | `CATEGORY_CONFIG` |
| `FeaturedEvent`| Variante destacada de `Event` (badge + resaltado)             | hereda de `Event` |
| `EventManager` | Colección de eventos + filtros + ordenamiento                 | `Event` (instancia de) |
| `User`         | Usuario actual + inscripciones por ID                         | nada (solo IDs) |
| `UIManager`    | Vista: DOM, eventos, render, feedback                          | `EventManager`, `User` |

El flujo de dependencias en runtime:

```
seedEvents() → Event/FeaturedEvent[]
                    │
                    ▼
              EventManager
                    │
        UIManager ◀┴▶ User
                    │
                    ▼
                  DOM
```