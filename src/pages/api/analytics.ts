import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: Array<{ month: string; amount: number; sales: number; rentals: number }>;
    byPaymentMethod: Array<{ method: string; amount: number; percentage: number }>;
    growth: number;
  };
  devices: {
    totalActive: number;
    totalSold: number;
    totalRented: number;
    mostPopular: Array<{ name: string; count: number; revenue: number }>;
    utilization: { rented: number; sold: number; available: number };
  };
  patients: {
    total: number;
    newThisMonth: number;
    byAffiliation: Array<{ type: string; count: number }>;
    activeRentals: number;
  };
  cnam: {
    totalBonds: number;
    approvedBonds: number;
    approvalRate: number;
    totalAmount: number;
    byBondType: Array<{ type: string; count: number; amount: number }>;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    amount?: number;
    date: string;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { timeRange = '12months' } = req.query;
    
    // Calculate date ranges
    const now = new Date();
    const startDate = getStartDate(timeRange as string);
    const previousPeriodStart = getPreviousPeriodStart(timeRange as string);

    try {
      // Revenue Analytics
      const [
        totalRevenue,
        previousPeriodRevenue,
        monthlyRevenue,
        paymentMethods,
        
        // Device Analytics
        devicesCount,
        deviceUtilization,
        popularDevices,
        
        // Patient Analytics
        patientsCount,
        newPatientsThisMonth,
        patiensByAffiliation,
        activeRentals,
        
        // CNAM Analytics
        cnamBonds,
        cnamByType,
        
        // Recent Activity
        recentSales,
        recentRentals,
        recentPayments
      ] = await Promise.all([
        // Revenue queries
        getSalesRevenue(startDate),
        getSalesRevenue(previousPeriodStart, startDate),
        getMonthlyRevenue(startDate),
        getPaymentMethodsBreakdown(startDate),
        
        // Device queries
        getDevicesCount(),
        getDeviceUtilization(),
        getPopularDevices(startDate),
        
        // Patient queries
        getPatientsCount(),
        getNewPatientsThisMonth(),
        getPatientsByAffiliation(),
        getActiveRentalsCount(),
        
        // CNAM queries
        getCNAMBonds(startDate),
        getCNAMByType(startDate),
        
        // Recent activity
        getRecentSales(),
        getRecentRentals(),
        getRecentPayments()
      ]);

      // Calculate growth percentage
      const growth = previousPeriodRevenue > 0 
        ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0;

      // Format payment methods with percentages
      const paymentMethodsWithPercentage = paymentMethods.map(pm => ({
        ...pm,
        percentage: totalRevenue > 0 ? (pm.amount / totalRevenue) * 100 : 0
      }));

      // Combine recent activity
      const recentActivity = [
        ...recentSales.map(sale => ({
          type: 'sale',
          description: `Vente - ${sale.patient?.firstName || sale.company?.companyName || 'Client'}`,
          amount: Number(sale.finalAmount),
          date: sale.saleDate.toISOString().split('T')[0]
        })),
        ...recentRentals.map(rental => ({
          type: 'rental',
          description: `Location ${rental.medicalDevice.name} - ${rental.patient?.firstName || rental.Company?.companyName || 'Client'}`,
          amount: rental.payment ? Number(rental.payment.amount) : undefined,
          date: rental.startDate.toISOString().split('T')[0]
        })),
        ...recentPayments.map(payment => ({
          type: 'payment',
          description: `Paiement ${payment.method} - ${payment.patient?.firstName || payment.company?.companyName || 'Client'}`,
          amount: Number(payment.amount),
          date: payment.paymentDate.toISOString().split('T')[0]
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      const analyticsData: AnalyticsData = {
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          byPaymentMethod: paymentMethodsWithPercentage,
          growth
        },
        devices: {
          totalActive: devicesCount.active,
          totalSold: devicesCount.sold,
          totalRented: devicesCount.rented,
          mostPopular: popularDevices,
          utilization: deviceUtilization
        },
        patients: {
          total: patientsCount,
          newThisMonth: newPatientsThisMonth,
          byAffiliation: patiensByAffiliation,
          activeRentals
        },
        cnam: {
          totalBonds: cnamBonds.total,
          approvedBonds: cnamBonds.approved,
          approvalRate: cnamBonds.total > 0 ? (cnamBonds.approved / cnamBonds.total) * 100 : 0,
          totalAmount: cnamBonds.totalAmount,
          byBondType: cnamByType
        },
        recentActivity
      };

      res.status(200).json(analyticsData);
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ message: 'Database error occurred' });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Helper functions
function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '3months':
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case '6months':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case '12months':
    default:
      return new Date(now.getFullYear(), now.getMonth() - 12, 1);
  }
}

function getPreviousPeriodStart(timeRange: string): Date {
  const startDate = getStartDate(timeRange);
  const now = new Date();
  const months = Math.abs(now.getMonth() - startDate.getMonth());
  return new Date(startDate.getFullYear(), startDate.getMonth() - months, 1);
}

async function getSalesRevenue(startDate: Date, endDate?: Date): Promise<number> {
  const whereClause = endDate 
    ? { saleDate: { gte: startDate, lt: endDate } }
    : { saleDate: { gte: startDate } };

  const result = await prisma.sale.aggregate({
    where: whereClause,
    _sum: { finalAmount: true }
  });
  
  return Number(result._sum.finalAmount) || 0;
}

async function getMonthlyRevenue(startDate: Date) {
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: startDate } },
    select: { saleDate: true, finalAmount: true }
  });

  const rentals = await prisma.rental.findMany({
    where: { startDate: { gte: startDate } },
    include: { payment: true }
  });

  const monthlyData = new Map();
  
  // Process sales
  sales.forEach(sale => {
    const month = sale.saleDate.toLocaleDateString('fr-FR', { month: 'short' });
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { month, amount: 0, sales: 0, rentals: 0 });
    }
    const data = monthlyData.get(month);
    data.amount += Number(sale.finalAmount);
    data.sales += 1;
  });

  // Process rentals
  rentals.forEach(rental => {
    if (rental.payment) {
      const month = rental.startDate.toLocaleDateString('fr-FR', { month: 'short' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month, amount: 0, sales: 0, rentals: 0 });
      }
      const data = monthlyData.get(month);
      data.amount += Number(rental.payment.amount);
      data.rentals += 1;
    }
  });

  return Array.from(monthlyData.values());
}

async function getPaymentMethodsBreakdown(startDate: Date) {
  const payments = await prisma.payment.groupBy({
    by: ['method'],
    where: { paymentDate: { gte: startDate } },
    _sum: { amount: true }
  });

  return payments.map(p => ({
    method: p.method,
    amount: Number(p._sum.amount) || 0
  }));
}

async function getDevicesCount() {
  const [active, sold, rented] = await Promise.all([
    prisma.medicalDevice.count({ where: { status: 'ACTIVE' } }),
    prisma.medicalDevice.count({ where: { status: 'SOLD' } }),
    prisma.rental.count({ where: { status: 'ACTIVE' } })
  ]);

  return { active, sold, rented };
}

async function getDeviceUtilization() {
  const [rented, sold, total] = await Promise.all([
    prisma.medicalDevice.count({ where: { status: 'FOR_RENT' } }),
    prisma.medicalDevice.count({ where: { status: 'SOLD' } }),
    prisma.medicalDevice.count()
  ]);

  const available = total - rented - sold;
  return { rented, sold, available };
}

async function getPopularDevices(startDate: Date) {
  // Use raw query approach to avoid Prisma groupBy issues
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: { saleDate: { gte: startDate } },
      medicalDeviceId: { not: null }
    },
    include: {
      medicalDevice: {
        select: { id: true, name: true }
      }
    }
  });

  // Group manually
  const deviceMap = new Map<string, { name: string; count: number; revenue: number }>();
  
  saleItems.forEach(item => {
    const deviceId = item.medicalDeviceId!;
    const deviceName = item.medicalDevice?.name || 'Appareil inconnu';
    const revenue = Number(item.itemTotal) || 0;
    
    if (deviceMap.has(deviceId)) {
      const existing = deviceMap.get(deviceId)!;
      existing.count += 1;
      existing.revenue += revenue;
    } else {
      deviceMap.set(deviceId, {
        name: deviceName,
        count: 1,
        revenue: revenue
      });
    }
  });

  // Convert to array and sort by count
  return Array.from(deviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function getPatientsCount(): Promise<number> {
  return prisma.patient.count();
}

async function getNewPatientsThisMonth(): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.patient.count({
    where: { createdAt: { gte: startOfMonth } }
  });
}

async function getPatientsByAffiliation() {
  const patients = await prisma.patient.groupBy({
    by: ['affiliation'],
    _count: { _all: true }
  });

  return patients.map(p => ({
    type: p.affiliation || 'Non spécifié',
    count: p._count._all
  }));
}

async function getActiveRentalsCount(): Promise<number> {
  return prisma.rental.count({
    where: { status: 'ACTIVE' }
  });
}

async function getCNAMBonds(startDate: Date) {
  const [total, approved, totalAmountResult] = await Promise.all([
    prisma.cNAMDossier.count({
      where: { createdAt: { gte: startDate } }
    }),
    prisma.cNAMDossier.count({
      where: { 
        createdAt: { gte: startDate },
        status: 'APPROUVE'
      }
    }),
    prisma.cNAMDossier.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { bondAmount: true }
    })
  ]);

  return {
    total,
    approved,
    totalAmount: Number(totalAmountResult._sum.bondAmount) || 0
  };
}

async function getCNAMByType(startDate: Date) {
  const bonds = await prisma.cNAMDossier.groupBy({
    by: ['bondType'],
    where: { createdAt: { gte: startDate } },
    _count: { _all: true },
    _sum: { bondAmount: true }
  });

  return bonds.map(bond => ({
    type: bond.bondType,
    count: bond._count._all,
    amount: Number(bond._sum.bondAmount) || 0
  }));
}

async function getRecentSales() {
  return prisma.sale.findMany({
    take: 5,
    orderBy: { saleDate: 'desc' },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      company: { select: { companyName: true } }
    }
  });
}

async function getRecentRentals() {
  return prisma.rental.findMany({
    take: 5,
    orderBy: { startDate: 'desc' },
    include: {
      medicalDevice: { select: { name: true } },
      patient: { select: { firstName: true, lastName: true } },
      Company: { select: { companyName: true } },
      payment: { select: { amount: true } }
    }
  });
}

async function getRecentPayments() {
  return prisma.payment.findMany({
    take: 5,
    orderBy: { paymentDate: 'desc' },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      company: { select: { companyName: true } }
    }
  });
}