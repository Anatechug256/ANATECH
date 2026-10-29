import React from 'react';
import { ProductCard, ProductCardProps } from './ProductCard';

export type ProductListingProps = ProductCardProps;

/**
 * ProductListing Component
 * Displays an individual marketplace product listing card with prominent verified seller trust badges,
 * price formatting in UGX, district/location info, condition labels, and favorite toggling.
 */
export const ProductListing: React.FC<ProductListingProps> = (props) => {
  return <ProductCard {...props} />;
};

export { ProductCard };
export default ProductListing;
