# **App Name**: FireNews

## Core Features:

- Autenticación de Usuario: Permite a los usuarios iniciar sesión con correo electrónico y contraseña utilizando Firebase Authentication.
- Gestión de Artículos de Noticias: Los usuarios autenticados pueden crear, editar y eliminar artículos de noticias a través del panel de control.
- Fuente de Noticias en Tiempo Real: Muestra los artículos de noticias obtenidos en tiempo real desde Firestore, actualizándose dinámicamente a medida que se agregan o modifican nuevos artículos.
- Ticker de Últimas Noticias: Desplaza continuamente los artículos de noticias 'importantes' horizontalmente en la parte inferior de la pantalla con un fondo rojo.
- Slider de Noticias: Muestra los artículos de noticias en un slider de pantalla completa, haciendo la transición automáticamente entre los artículos según su duración especificada.
- Integración con Firestore: Utiliza Firestore para almacenar artículos de noticias, incluyendo contenido de texto, URLs de imágenes, indicador de importancia, duración de la visualización y marca de tiempo de creación.

## Style Guidelines:

- Color primario: Azul Oscuro (#243c5a) para crear una sensación de confianza y fiabilidad en las noticias.
- Color de fondo: Gris claro (#f0f0f3) para una apariencia limpia y moderna.
- Color de acento: Rojo (#e03616) para el ticker de noticias de última hora y llamadas a la acción importantes.
- Fuente del cuerpo y del titular: Fuente sans-serif 'Inter' para una sensación moderna y neutral que garantiza la legibilidad y una estética limpia.
- Se utilizarán iconos simples y claros de una biblioteca como 'react-icons' para representar acciones como editar, eliminar y guardar.
- Diseño receptivo con Tailwind CSS para garantizar que la aplicación se vea bien en todos los dispositivos. El uso de componentes 'shadcn/ui' mantendrá la coherencia en toda la aplicación.
- Transiciones suaves con Framer Motion entre artículos de noticias en el slider para proporcionar una experiencia de usuario visualmente atractiva e interesante.