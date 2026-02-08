import { HiArrowRight, HiMail, HiPhone, HiDownload } from 'react-icons/hi';

interface ButtonBlockData {
    text: string;
    link: string;
    style?: 'primary' | 'secondary';
    size?: 'small' | 'normal' | 'large';
    icon?: 'arrow' | 'mail' | 'phone' | 'download' | 'none';
    alignment?: 'left' | 'center' | 'right';
}

interface ButtonBlockProps {
    data: ButtonBlockData;
}

export default function ButtonBlock({ data }: ButtonBlockProps) {
    const {
        text,
        link,
        style = 'primary',
        size = 'normal',
        icon = 'arrow',
        alignment = 'center'
    } = data;

    const iconMap = {
        arrow: HiArrowRight,
        mail: HiMail,
        phone: HiPhone,
        download: HiDownload,
        none: null
    };

    const IconComponent = iconMap[icon];

    const getSizeStyles = () => {
        if (size === 'small') return { padding: '0.5rem 1.25rem', fontSize: '0.9rem' };
        if (size === 'large') return { padding: '1rem 2.5rem', fontSize: '1.1rem' };
        return {};
    };

    const buttonClass = `btn btn-${style}`;

    return (
        <section style={{ padding: '2rem 0' }}>
            <div className="container" style={{ textAlign: alignment as any }}>
                <a href={link} className={buttonClass} style={getSizeStyles()}>
                    {text}
                    {IconComponent && <IconComponent style={{ marginLeft: '8px' }} />}
                </a>
            </div>
        </section>
    );
}

