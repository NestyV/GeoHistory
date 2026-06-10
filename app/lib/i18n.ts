// Language translations
export type Language = 'es' | 'en' | 'pt'

export const translations = {
  es: {
    // Common
    appName: 'GeoHistory',
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    add: 'Agregar',
    search: 'Buscar',
    confirm: 'Confirmar',
    more: 'más',
    help: 'Ayuda',
    convert: 'Convertir',
    accessDenied: 'Acceso denegado. Se requieren permisos de Curador o Administrador.',
    approve: 'Aprobar',
    reject: 'Rechazar',
    editEvent: 'Editar Evento',
    allEvents: 'Todos los Eventos',
    characters: 'Personajes',
    historicalFrames: 'Marcos Históricos',
    pendingEvents: 'Eventos Pendientes',
    adminPanel: 'Panel de Administración',
    addCharacter: 'Agregar Personaje',
    characterName: 'Nombre del personaje',
    imageUrl: 'URL de la imagen',
    imagePreview: 'Vista previa',
    noImage: 'Sin imagen',
    allYearsBtn: 'Todos los años',
    allFramesBtn: 'Todos los marcos',
    addNewCharacter: 'Agregar un personaje no listado',
    
    // Navigation
    map: 'Mapa',
    timeline: 'Línea de Tiempo',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    signUp: 'Registrarse',
    admin: 'Administrador',
    regular: 'Regular',
    curator: 'Curador',
    
    // Home Page
    homeDescription: 'Explora eventos históricos en un mapa interactivo. Descubre dónde ocurrió la historia y contribuye a un mapa colaborativo.',
    exploreMap: 'Explorar Mapa',
    viewTimeline: 'Ver Línea de Tiempo',
    getStarted: 'Comenzar',
    featureMarkEvents: 'Marcar Eventos',
    featureMarkEventsDesc: 'Haz clic derecho en el mapa para agregar eventos históricos con ubicaciones exactas',
    featureTimeline: 'Vista Cronológica',
    featureTimelineDesc: 'Navega por la historia año por año y ve los eventos aparecer en el mapa',
    featureCollaborate: 'Colaboración',
    featureCollaborateDesc: 'Contribuye al mapa histórico global y ayuda a otros a descubrir la historia',
    
    // Map
    allYears: 'Todos',
    allFrames: 'Todos los marcos',
    events: 'eventos',
    event: 'evento',
    location: 'Ubicación',
    date: 'Fecha',
    description: 'Descripción',
    historicalFigures: 'Figuras Históricas',
    figures: 'Figuras',
    submittedBy: 'Enviado por',
    pendingApproval: 'Pendiente de Aprobación',
    approved: 'Aprobado',
    addEvent: 'Agregar Evento',
    title: 'Título',
    historicalFrame: 'Marco Histórico',
    addNewFrame: 'Agregar nuevo marco histórico no listado',
    createFrame: 'Crear Marco',
    frameName: 'Nombre del marco',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin',
    
    // Admin
    manageCharacters: 'Gestionar Personajes',
    
    // Auth
    email: 'Correo electrónico',
    password: 'Contraseña',
    fullName: 'Nombre completo',
    signIn: 'Iniciar Sesión',
    signUpSuccess: '¡Registro exitoso! Ahora puedes iniciar sesión.',
    loginSuccess: 'Inicio de sesión exitoso',
    invalidCredentials: 'Credenciales inválidas',
    
    // Timeline
    historicalTimeline: 'Línea de Tiempo Histórica',
    noEventsForYear: 'No hay eventos registrados para {year}',
    noEventsYet: 'Aún no hay eventos aprobados. Los eventos que envíes aparecerán aquí después de la aprobación del administrador.',
    
    // Map Popup
    figuresLabel: 'Figuras Históricas:',
    locationLabel: '📍 Ubicación:',
    
    // Right click
    loginToAdd: 'Por favor inicia sesión para agregar eventos',
    eventSubmitted: '¡Evento enviado para aprobación! El administrador lo revisará pronto.',
    
    // Errors
    errorOccurred: 'Ocurrió un error inesperado',
  },
  
  en: {
    // Common
    appName: 'GeoHistory',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    confirm: 'Confirm',
    more: 'more',
    help: 'Help',
    convert: 'Convert',
    accessDenied: 'Access denied. Curator or Admin privileges required.',
    approve: 'Approve',
    reject: 'Reject',
    editEvent: 'Edit Event',
    allEvents: 'All Events',
    characters: 'Characters',
    historicalFrames: 'Historical Frames',
    pendingEvents: 'Pending Events',
    adminPanel: 'Admin Panel',
    addCharacter: 'Add Character',
    characterName: 'Character name',
    imageUrl: 'Image URL',
    imagePreview: 'Preview',
    noImage: 'No image',
    allYearsBtn: 'All years',
    allFramesBtn: 'All frames',
    addNewCharacter: 'Add a character not in the list',
    
    // Navigation
    map: 'Map',
    timeline: 'Timeline',
    login: 'Login',
    logout: 'Logout',
    signUp: 'Sign Up',
    admin: 'Admin',
    regular: 'Regular',
    curator: 'Curator',
    
    // Home Page
    homeDescription: 'Explore historical events on an interactive map. Discover where history happened and contribute to a collaborative map.',
    exploreMap: 'Explore Map',
    viewTimeline: 'View Timeline',
    getStarted: 'Get Started',
    featureMarkEvents: 'Mark Events',
    featureMarkEventsDesc: 'Right-click on the map to add historical events with exact locations',
    featureTimeline: 'Chronological View',
    featureTimelineDesc: 'Browse history year by year and see events appear on the map',
    featureCollaborate: 'Collaborate',
    featureCollaborateDesc: 'Contribute to the global historical map and help others discover history',
    
    // Map
    allYears: 'All',
    allFrames: 'All frames',
    events: 'events',
    event: 'event',
    location: 'Location',
    date: 'Date',
    description: 'Description',
    historicalFigures: 'Historical Figures',
    figures: 'Figures',
    submittedBy: 'Submitted by',
    pendingApproval: 'Pending Approval',
    approved: 'Approved',
    addEvent: 'Add Event',
    title: 'Title',
    historicalFrame: 'Historical Frame',
    addNewFrame: 'Add a new historical frame not in the list',
    createFrame: 'Create Frame',
    frameName: 'Frame name',
    startDate: 'Start date',
    endDate: 'End date',
    
    // Admin
    manageCharacters: 'Manage Characters',
    
    // Auth
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    signIn: 'Sign In',
    signUpSuccess: 'Sign up successful! You can now log in.',
    loginSuccess: 'Login successful',
    invalidCredentials: 'Invalid credentials',
    
    // Timeline
    historicalTimeline: 'Historical Timeline',
    noEventsForYear: 'No events recorded for {year}',
    noEventsYet: 'No approved events yet. Events you submit will appear here after admin approval.',
    
    // Map Popup
    figuresLabel: 'Historical Figures:',
    locationLabel: '📍 Location:',
    
    // Right click
    loginToAdd: 'Please login to add events',
    eventSubmitted: 'Event submitted for approval! Admin will review it soon.',
    
    // Errors
    errorOccurred: 'An unexpected error occurred',
  },
  
  pt: {
    // Common
    appName: 'GeoHistory',
    loading: 'Carregando...',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    add: 'Adicionar',
    search: 'Buscar',
    confirm: 'Confirmar',
    more: 'mais',
    help: 'Ajuda',
    convert: 'Converter',
    accessDenied: 'Acesso negado. Privilégios de Curador ou Administrador necessários.',
    approve: 'Aprovar',
    reject: 'Rejeitar',
    editEvent: 'Editar Evento',
    allEvents: 'Todos Eventos',
    characters: 'Personagens',
    historicalFrames: 'Quadros Históricos',
    pendingEvents: 'Eventos Pendentes',
    adminPanel: 'Painel Admin',
    addCharacter: 'Adicionar Personagem',
    characterName: 'Nome do personagem',
    imageUrl: 'URL da imagem',
    imagePreview: 'Pré-visualização',
    noImage: 'Sem imagem',
    allYearsBtn: 'Todos os anos',
    allFramesBtn: 'Todos os quadros',
    addNewCharacter: 'Adicionar personagem não listado',
    
    // Navigation
    map: 'Mapa',
    timeline: 'Linha do Tempo',
    login: 'Entrar',
    logout: 'Sair',
    signUp: 'Registrar',
    admin: 'Administrador',
    regular: 'Regular',
    curator: 'Curador',
    
    // Home Page
    homeDescription: 'Explore eventos históricos em um mapa interativo. Descubra onde a história aconteceu e contribua para um mapa colaborativo.',
    exploreMap: 'Explorar Mapa',
    viewTimeline: 'Ver Linha do Tempo',
    getStarted: 'Começar',
    featureMarkEvents: 'Marcar Eventos',
    featureMarkEventsDesc: 'Clique com o botão direito no mapa para adicionar eventos históricos com localizações exatas',
    featureTimeline: 'Visão Cronológica',
    featureTimelineDesc: 'Navegue pela história ano a ano e veja os eventos aparecerem no mapa',
    featureCollaborate: 'Colaboração',
    featureCollaborateDesc: 'Contribua para o mapa histórico global e ajude outros a descobrir a história',
    
    // Map
    allYears: 'Todos',
    allFrames: 'Todos os quadros',
    events: 'eventos',
    event: 'evento',
    location: 'Localização',
    date: 'Data',
    description: 'Descrição',
    historicalFigures: 'Figuras Históricas',
    figures: 'Figuras',
    submittedBy: 'Enviado por',
    pendingApproval: 'Pendente',
    approved: 'Aprovado',
    addEvent: 'Adicionar Evento',
    title: 'Título',
    historicalFrame: 'Quadro Histórico',
    addNewFrame: 'Adicionar novo quadro histórico',
    createFrame: 'Criar Quadro',
    frameName: 'Nome do quadro',
    startDate: 'Data inicial',
    endDate: 'Data final',
    
    // Admin
    manageCharacters: 'Gerenciar Personagens',
    
    // Auth
    email: 'E-mail',
    password: 'Senha',
    fullName: 'Nome completo',
    signIn: 'Entrar',
    signUpSuccess: 'Registro bem-sucedido! Agora você pode fazer login.',
    loginSuccess: 'Login bem-sucedido',
    invalidCredentials: 'Credenciais inválidas',
    
    // Timeline
    historicalTimeline: 'Linha do Tempo Histórica',
    noEventsForYear: 'Nenhum evento registrado para {year}',
    noEventsYet: 'Ainda não há eventos aprovados. Os eventos que você enviar aparecerão aqui após a aprovação do administrador.',
    
    // Map Popup
    figuresLabel: 'Figuras Históricas:',
    locationLabel: '📍 Localização:',
    
    // Right click
    loginToAdd: 'Faça login para adicionar eventos',
    eventSubmitted: 'Evento enviado para aprovação! O administrador revisará em breve.',
    
    // Errors
    errorOccurred: 'Ocorreu um erro inesperado',
  }
}

// Función para obtener el idioma de forma segura en el cliente
export function getClientLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
      return saved
    }
  }
  return 'es'
}

// Función de traducción segura para usar en componentes cliente
export function t(key: keyof typeof translations.es): string {
  const lang = getClientLanguage()
  return translations[lang][key] || translations.es[key] || key
}

export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' }
]
