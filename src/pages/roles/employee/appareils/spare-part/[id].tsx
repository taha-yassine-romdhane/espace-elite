import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import prisma from '@/lib/db';
import { Product, Stock, StockLocation, Sale, SaleItem, Patient, User } from '@prisma/client';
import { ProductHeader } from '@/components/product/ProductHeader';
import { StockInfo } from '@/components/product/StockInfo';
import { MovementHistory } from '@/components/product/MovementHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSession } from 'next-auth/react';
import EmployeeLayout from '../../EmployeeLayout';

interface SparePartDetailProps {
  product: Product & {
    stocks: (Stock & {
      location: StockLocation;
    })[];
    saleItems: (SaleItem & {
      sale: Sale & {
        patient: Patient | null;
        assignedTo: User | null;
      };
    })[];
  };
  totalSold: number;
  totalRevenue: number;
}

function SparePartDetail({ product, totalSold, totalRevenue }: SparePartDetailProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  // Calculate total stock excluding "vendu" location
  const totalStock = product.stocks
    .filter(stock => stock.location.name.toLowerCase() !== 'vendu')
    .reduce((sum, stock) => sum + stock.quantity, 0);

  // Get quantity in "vendu" location (items that have been sold)
  const soldStock = product.stocks
    .filter(stock => stock.location.name.toLowerCase() === 'vendu')
    .reduce((sum, stock) => sum + stock.quantity, 0);

  // Use the maximum between actual sales records and sold stock location
  const actualTotalSold = Math.max(totalSold, soldStock);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ACTIVE: 'default',
      OUT_OF_STOCK: 'destructive',
      DISCONTINUED: 'secondary'
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      OUT_OF_STOCK: 'Rupture de stock',
      DISCONTINUED: 'Discontinué'
    };
    return { variant: variants[status] || 'default', label: labels[status] || status };
  };

  const statusBadge = getStatusBadge(product.status);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {product.productCode && (
                <Badge variant="outline" className="font-mono text-green-900 border-green-900">
                  {product.productCode}
                </Badge>
              )}
              <Badge variant={statusBadge.variant as any}>
                {statusBadge.label}
              </Badge>
              <Badge variant="secondary">Pièce de rechange</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Stock Total</p>
                <p className="text-xl font-bold text-green-600">{totalStock}</p>
              </div>
              <Package className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Vendu</p>
                <p className="text-xl font-bold text-green-600">{actualTotalSold}</p>
              </div>
              <ShoppingCart className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Revenu Total</p>
                <p className="text-xl font-bold text-green-600">{totalRevenue.toFixed(2)} DT</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Prix de Vente</p>
                <p className="text-xl font-bold text-green-900">{product.sellingPrice ? `${product.sellingPrice} DT` : 'Non défini'}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-1">
          <ProductHeader product={product} />
        </div>

        {/* Stock Info */}
        <div className="lg:col-span-2">
          <StockInfo product={product} />
        </div>
      </div>

      {/* Movement History */}
      <div className="mt-6">
        <MovementHistory product={product} />
      </div>
    </div>
  );
}

SparePartDetail.getLayout = (page: React.ReactNode) => (
  <EmployeeLayout>{page}</EmployeeLayout>
);

export default SparePartDetail;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const { id } = context.params as { id: string };

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stocks: {
        include: {
          location: true,
        },
      },
      saleItems: {
        include: {
          sale: {
            include: {
              patient: true,
              assignedTo: true,
            },
          },
        },
      },
    },
  });

  if (!product || product.type !== 'SPARE_PART') {
    return {
      notFound: true,
    };
  }

  // Calculate total sold and revenue
  const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = product.saleItems.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);

  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
      totalSold,
      totalRevenue,
    },
  };
};
