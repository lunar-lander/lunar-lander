import React from 'react';
import styles from './Card.module.css';

type CardVariant = 'default' | 'flat' | 'elevated';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children }) => {
  const headerClasses = [styles.header, className].filter(Boolean).join(' ');
  return <div className={headerClasses}>{children}</div>;
};

const CardBody: React.FC<CardBodyProps> = ({ className = '', children }) => {
  const bodyClasses = [styles.body, className].filter(Boolean).join(' ');
  return <div className={bodyClasses}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({ className = '', children }) => {
  const footerClasses = [styles.footer, className].filter(Boolean).join(' ');
  return <div className={footerClasses}>{children}</div>;
};

const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({ variant = 'default', className = '', children }) => {
  const cardClasses = [
    styles.card,
    variant !== 'default' ? styles[variant] : '',
    className
  ].filter(Boolean).join(' ');

  return <div className={cardClasses}>{children}</div>;
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;