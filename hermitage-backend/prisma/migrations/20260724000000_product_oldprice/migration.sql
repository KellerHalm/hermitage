-- Old / crossed-out price for discounted products.
-- When `oldPrice` > `price`, the product is considered to be on sale.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "oldPrice" DECIMAL(10,2);
