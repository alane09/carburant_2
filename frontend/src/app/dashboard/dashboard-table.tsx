'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VehicleRecord } from '@/types/api';
import { formatNumber } from '@/lib/utils';

interface DashboardTableProps {
  data: VehicleRecord[];
}

export function DashboardTable({ data }: DashboardTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Matricule</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Consumption (L)</TableHead>
            <TableHead className="text-right">Consumption (TEP)</TableHead>
            <TableHead className="text-right">Cost (DT)</TableHead>
            <TableHead className="text-right">Kilometers</TableHead>
            <TableHead className="text-right">Products (T)</TableHead>
            <TableHead className="text-right">IPE (L/100km)</TableHead>
            <TableHead className="text-right">IPE (L/100Tkm)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.type}</TableCell>
              <TableCell>{record.matricule}</TableCell>
              <TableCell>{record.mois}</TableCell>
              <TableCell>{record.year}</TableCell>
              <TableCell className="text-right">
                {formatNumber(record.consommationL)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(record.consommationTEP)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(record.coutDT)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(record.kilometrage)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(record.produitsTonnes)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(record.ipeL100km)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(record.ipeL100TonneKm)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 