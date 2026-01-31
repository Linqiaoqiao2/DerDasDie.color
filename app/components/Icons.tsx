const Icon = ({ className = "", children, ...props }: any) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
)

export const CatIcon = ({ className = "" }: any) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <ellipse cx="50" cy="60" rx="35" ry="30" />
    <ellipse cx="25" cy="35" rx="12" ry="18" />
    <ellipse cx="75" cy="35" rx="12" ry="18" />
    <circle cx="40" cy="55" r="5" fill="white" /><circle cx="60" cy="55" r="5" fill="white" />
    <circle cx="41" cy="56" r="2.5" fill="#2D3748" /><circle cx="61" cy="56" r="2.5" fill="#2D3748" />
    <ellipse cx="50" cy="68" rx="4" ry="3" fill="#FFB6C1" />
    <path d="M46 72 Q50 76 54 72" stroke="#2D3748" strokeWidth="2" fill="none" />
  </svg>
)

export const PawIcon = ({ className = "" }: any) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <ellipse cx="12" cy="17" rx="5" ry="4" />
    <circle cx="7" cy="10" r="2.5" /><circle cx="17" cy="10" r="2.5" />
    <circle cx="5" cy="14" r="2" /><circle cx="19" cy="14" r="2" />
  </svg>
)

export const StarIcon = ({ className = "", filled = false }: any) => (
  <Icon className={className} fill={filled ? "currentColor" : "none"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Icon>
)

export const VolumeIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </Icon>
)

export const ArrowLeftIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Icon>
)

export const XIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
)

export const CheckIcon = ({ className = "" }: any) => (
  <Icon className={className}><polyline points="20 6 9 17 4 12" /></Icon>
)

export const BookIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Icon>
)

export const UploadIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </Icon>
)

export const EditIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Icon>
)

export const LoaderIcon = ({ className = "" }: any) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

export const TrashIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
)

export const LayersIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </Icon>
)

export const DownloadIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
)

export const FileTextIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </Icon>
)

export const AlertIcon = ({ className = "" }: any) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </Icon>
)
