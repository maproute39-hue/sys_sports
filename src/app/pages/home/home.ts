import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type SummaryChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
};

export type SparklineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  tooltip: ApexTooltip;
  xaxis: ApexXAxis;
};

export type RadialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  labels: string[];
};

interface TopDestination {
  name: string;
  flag: string;
  packages: number;
}

interface ReservationItem {
  name: string;
  avatar: string;
  date: string;
  description: string;
  category: 'Revenue' | 'Expense';
  amount: number;
  status: 'Completed' | 'Paid' | 'Pending';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  // KPIs
  monthlyIncome = 120540;
  confirmedBookings = 20;
  pendingBalance = 36220;
  monthlyQuotes = 12;

  // panel ingreso mensual
  incomeProgressPercent = 92;
  monthlyReservations = 673;
  todayIncome = 7540;
  targetIncome = 75000;
  currentIncome = 15000;

  // conversión
  totalSales = 32500;

  // top destinos
  topDestinationsRevenue = 45314;
  topDestinations: TopDestination[] = [
    {
      name: 'Muralla (México)',
      flag: 'assets/images/country/mx.png',
      packages: 4265,
    },
    {
      name: 'Playa (México)',
      flag: 'assets/images/country/mx.png',
      packages: 3740,
    },
    {
      name: 'Japón',
      flag: 'assets/images/country/japan.svg',
      packages: 1640,
    },
  ];

  // filtro periodo
  selectedPeriod: 'thisYear' | 'lastYear' = 'thisYear';

  // búsqueda y paginación tabla
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
conversionSegments = [
  {
    label: 'Pagos',
    value: 79,
    progressClass: 'bg-primary',
    textClass: 'text-primary'
  },
  {
    label: 'Cancelados',
    value: 22,
    progressClass: 'bg-primary bg-opacity-75',
    textClass: 'text-primary text-opacity-75'
  },
  {
    label: 'Devoluciones',
    value: 3,
    progressClass: 'bg-primary bg-opacity-50',
    textClass: 'text-primary text-opacity-50'
  }
];
  reservations: ReservationItem[] = [
    {
      name: 'Emma Johnson',
      avatar: 'assets/images/avatar/avatar1.webp',
      date: '28 Oct 2025',
      description: 'Cancun Beach Resort Package',
      category: 'Revenue',
      amount: 2500,
      status: 'Completed',
    },
    {
      name: 'Liam Anderson',
      avatar: 'assets/images/avatar/avatar2.webp',
      date: '26 Oct 2025',
      description: 'Tulum Eco Adventure',
      category: 'Expense',
      amount: -1200,
      status: 'Paid',
    },
    {
      name: 'Olivia Brown',
      avatar: 'assets/images/avatar/avatar3.webp',
      date: '23 Oct 2025',
      description: 'Playa del Carmen Luxury Stay',
      category: 'Expense',
      amount: -89,
      status: 'Pending',
    },
    {
      name: 'Noah Wilson',
      avatar: 'assets/images/avatar/avatar4.webp',
      date: '22 Oct 2025',
      description: 'Acapulco Surfing Trip',
      category: 'Revenue',
      amount: 800,
      status: 'Completed',
    },
    {
      name: 'Sophia Taylor',
      avatar: 'assets/images/avatar/avatar5.webp',
      date: '28 Oct 2025',
      description: 'Puerto Vallarta Yacht Cruise',
      category: 'Revenue',
      amount: 2500,
      status: 'Completed',
    },
    {
      name: 'James Miller',
      avatar: 'assets/images/avatar/avatar6.webp',
      date: '26 Oct 2025',
      description: 'Riviera Maya Snorkeling Tour',
      category: 'Expense',
      amount: -1200,
      status: 'Paid',
    },
    {
      name: 'Ava Martinez',
      avatar: 'assets/images/avatar/avatar7.webp',
      date: '23 Oct 2025',
      description: 'Los Cabos Fishing Expedition',
      category: 'Expense',
      amount: -89,
      status: 'Pending',
    },
    {
      name: 'Ethan Davis',
      avatar: 'assets/images/avatar/avatar8.webp',
      date: '22 Oct 2025',
      description: 'Huatulco Whale Watching',
      category: 'Revenue',
      amount: 800,
      status: 'Completed',
    },
    {
      name: 'Isabella Moore',
      avatar: 'assets/images/avatar/avatar9.webp',
      date: '28 Oct 2025',
      description: 'Yucatan Peninsula Exploration',
      category: 'Revenue',
      amount: 2500,
      status: 'Completed',
    },
    {
      name: 'Mason Clark',
      avatar: 'assets/images/avatar/avatar10.webp',
      date: '26 Oct 2025',
      description: 'Isla Mujeres Biking Tour',
      category: 'Expense',
      amount: -1200,
      status: 'Paid',
    },
    {
      name: 'Liam Anderson',
      avatar: 'assets/images/avatar/avatar2.webp',
      date: '23 Oct 2025',
      description: 'Cozumel Diving Package',
      category: 'Expense',
      amount: -89,
      status: 'Pending',
    },
    {
      name: 'Noah Wilson',
      avatar: 'assets/images/avatar/avatar4.webp',
      date: '22 Oct 2025',
      description: 'Yucatan Peninsula Exploration',
      category: 'Revenue',
      amount: 800,
      status: 'Completed',
    },
  ];

  // charts
  summaryChartOptions: Partial<SummaryChartOptions>;
  leadsChartOptions: Partial<DonutChartOptions>;
  monthlyStatusChartOptions: Partial<SparklineChartOptions>;
  monthlyTargetChartOptions: Partial<RadialChartOptions>;

  constructor() {
    this.summaryChartOptions = this.buildSummaryChart(this.selectedPeriod);

    this.leadsChartOptions = {
      series: [60, 25, 15],
      chart: {
        type: 'donut',
        height: 280,
      },
      labels: ['Confirmadas', 'Pendientes', 'Canceladas'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 220,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
      legend: {
        position: 'bottom',
      },
    };

    this.monthlyStatusChartOptions = {
      series: [
        {
          name: 'Ingresos',
          data: [20, 35, 28, 45, 38, 52, 48, 60, 55, 70, 62, 80],
        },
      ],
      chart: {
        type: 'area',
        height: 180,
        sparkline: {
          enabled: true,
        },
        toolbar: {
          show: false,
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      tooltip: {
        enabled: true,
      },
      xaxis: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      },
    };

    this.monthlyTargetChartOptions = {
      series: [79],
      chart: {
        type: 'radialBar',
        height: 260,
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '55%',
          },
          track: {
            background: '#edf1f7',
          },
          dataLabels: {
            name: {
              show: true,
            },
            value: {
              fontSize: '28px',
              fontWeight: '700',
              show: true,
              formatter: (val: number) => `${val}%`,
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
      },
      stroke: {
        lineCap: 'round',
      },
      fill: {
        type: 'solid',
      },
      labels: ['Conversión'],
    };
  }

  buildSummaryChart(period: 'thisYear' | 'lastYear'): Partial<SummaryChartOptions> {
    const quotesData =
      period === 'thisYear'
        ? [12, 18, 15, 20, 22, 24, 19, 26, 28, 30, 27, 25]
        : [10, 14, 13, 17, 19, 20, 16, 21, 23, 24, 22, 20];

    const bookingsData =
      period === 'thisYear'
        ? [8, 12, 10, 14, 16, 18, 15, 20, 21, 24, 22, 20]
        : [7, 10, 9, 12, 14, 15, 13, 17, 18, 19, 18, 16];

    return {
      series: [
        {
          name: 'Cotizaciones',
          data: quotesData,
        },
        {
          name: 'Reservas',
          data: bookingsData,
        },
      ],
      chart: {
        type: 'line',
        height: 320,
        toolbar: {
          show: false,
        },
      },
      xaxis: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
      },
      tooltip: {
        enabled: true,
      },
    };
  }

  onPeriodChange(): void {
    this.summaryChartOptions = this.buildSummaryChart(this.selectedPeriod);
  }

  get filteredReservations(): ReservationItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.reservations;
    }

    return this.reservations.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      item.date.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReservations.length / this.pageSize));
  }

  get paginatedReservations(): ReservationItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredReservations.slice(start, end);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  getShowingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredReservations.length);
  }

  Math = Math;
}