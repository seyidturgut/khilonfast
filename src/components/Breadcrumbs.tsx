import { Link } from 'react-router-dom'
import { HiHome, HiChevronRight } from 'react-icons/hi2'
import './Breadcrumbs.css'

interface BreadcrumbItem {
    label: string
    path?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            <div className="container breadcrumbs-container">
                <ol className="breadcrumbs-list">
                    <li className="breadcrumb-item">
                        <Link to="/" className="breadcrumb-link home-link">
                            <HiHome />
                        </Link>
                    </li>
                    {items.map((item, index) => (
                        <li key={index} className="breadcrumb-item">
                            <HiChevronRight className="breadcrumb-separator" />
                            {item.path ? (
                                <Link to={item.path} className="breadcrumb-link">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="breadcrumb-current">{item.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </nav>
    )
}
