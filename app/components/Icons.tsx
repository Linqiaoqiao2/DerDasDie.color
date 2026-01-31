import { 
  FiArrowLeft,
  FiX,
  FiCheck,
  FiBook,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiLayers,
  FiDownload,
  FiFileText,
  FiAlertCircle,
  FiLoader,
  FiVolume2,
  FiStar,
} from 'react-icons/fi'
import { FaStar, FaPaw } from 'react-icons/fa'
import { LuCat } from 'react-icons/lu'
import styles from './Icons.module.css'


export { 
  FiArrowLeft as ArrowLeftIcon,
  FiX as XIcon,
  FiCheck as CheckIcon,
  FiBook as BookIcon,
  FiUpload as UploadIcon,
  FiEdit as EditIcon,
  FiTrash2 as TrashIcon,
  FiLayers as LayersIcon,
  FiDownload as DownloadIcon,
  FiFileText as FileTextIcon,
  FiAlertCircle as AlertIcon,
  FiVolume2 as VolumeIcon,
}


export const LoaderIcon = ({ className = "" }: { className?: string }) => (
  <FiLoader className={`${styles.spin} ${className}`} />
)

export const StarIcon = ({ className = "", filled = false }: { className?: string; filled?: boolean }) => {
  const Icon = filled ? FaStar : FiStar
  return <Icon className={className} />
}


export { LuCat as CatIcon, FaPaw as PawIcon }
