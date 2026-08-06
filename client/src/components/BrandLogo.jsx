import React from 'react';
import logo from '../assets/logo.jpg';

export function BrandLogo({ className = '' }) {
  return (
    <img
      src={logo}
      alt="GreenCycle"
      className={`block object-contain ${className}`}
      draggable="false"
      decoding="async"
      loading="eager"
    />
  );
}

export default BrandLogo;
