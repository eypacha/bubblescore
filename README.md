# BubbleScore 🫧

Un juego de física interactivo donde las matemáticas se encuentran con la diversión. Combina burbujas numéricas para alcanzar objetivos específicos usando simulación física realista.

## 🎮 Descripción del Juego

BubbleScore es un juego de puzzle físico donde los jugadores deben combinar burbujas que contienen números para alcanzar una suma objetivo específica. Las burbujas caen desde la parte superior del canvas con diferentes tamaños y valores numéricos, y los jugadores pueden interactuar con ellas para crear colisiones estratégicas.

### Mecánicas de Juego

- **Caída de Burbujas**: Las burbujas caen continuamente desde la parte superior del canvas con valores numéricos aleatorios
- **Objetivo por Ronda**: Cada ronda presenta un número objetivo que el jugador debe alcanzar (ej: sumar exactamente 10)
- **Interacción Física**: Los jugadores pueden mover, empujar o dirigir las burbujas usando el mouse o touch
- **Colisiones Estratégicas**: Cuando las burbujas colisionan y su suma coincide con el objetivo, desaparecen y se otorga un punto
- **Progresión**: Cada nivel aumenta la dificultad con objetivos más complejos y más burbujas en pantalla
- **Sistema de Puntuación**: Se registran los puntajes altos y se almacenan en la nube

### Características Principales

- ✨ **Física Realista**: Simulación física avanzada con Matter.js
- 🎯 **Objetivos Dinámicos**: Diferentes objetivos matemáticos en cada ronda
- 🏆 **Leaderboard Global**: Puntuaciones almacenadas en Supabase
- 📱 **Responsive**: Optimizado para dispositivos móviles y desktop con Tailwind CSS
- 🌍 **Multiidioma**: Soporte para múltiples idiomas
- 🎨 **Diseño Moderno**: Interfaz atractiva con PrimeVue y Tailwind CSS

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Vue 3** - Framework principal con Composition API
- **Vite** - Herramienta de build y desarrollo
- **Tailwind CSS** - Framework de CSS utility-first para estilos modernos y responsive
- **PrimeVue** - Biblioteca de componentes UI (integrado con Tailwind)
- **Vue Router** - Navegación entre vistas
- **Vue I18n** - Internacionalización

### Física y Juego
- **Matter.js** - Motor de física 2D para simulación realista de colisiones y movimiento
- **Canvas HTML5** - Renderizado del área de juego

### Estado y Datos
- **Pinia** - Gestión del estado global del juego
- **Supabase** - Backend como servicio para:
  - Almacenamiento de puntuaciones
  - Autenticación de usuarios
  - Base de datos en tiempo real

### Desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **TypeScript** (opcional) - Tipado estático

## 🚀 Instalación y Desarrollo

```bash
# Clonar el repositorio
git clone [repository-url]
cd bubblescore

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview de la build
npm run preview
```

## 🎯 Roadmap

### Fase 1: Core del Juego
- [ ] Configuración de Matter.js
- [ ] Sistema básico de burbujas
- [ ] Mecánica de objetivos
- [ ] Sistema de puntuación básico

### Fase 2: Experiencia de Usuario
- [ ] Interfaz de usuario con PrimeVue
- [ ] Sistema de niveles
- [ ] Efectos visuales y sonoros
- [ ] Tutorial interactivo

### Fase 3: Características Avanzadas
- [ ] Integración con Supabase
- [ ] Leaderboard global
- [ ] Sistema de logros
- [ ] Modos de juego adicionales

### Fase 4: Pulido
- [ ] Optimizaciones de rendimiento
- [ ] Testing exhaustivo
- [ ] Documentación completa
- [ ] Deployment

## 🏗️ Estructura del Proyecto

```
bubblescore/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── views/            # Vistas principales
│   ├── stores/           # Stores de Pinia
│   ├── game/             # Lógica del juego y Matter.js
│   ├── services/         # Servicios (Supabase, API)
│   ├── utils/            # Utilidades
│   ├── i18n/             # Archivos de traducción
│   └── assets/           # Recursos estáticos
├── public/               # Archivos públicos
└── docs/                # Documentación adicional
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🎮 ¡Juega Ya!

[Link al juego desplegado] (Próximamente)

---

Desarrollado con ❤️ usando Vue 3 y Matter.js
