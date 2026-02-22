'use client';

import dynamic from 'next/dynamic';
import TableView from '@/components/TableView';

const Calendar = dynamic(() => import('@/components/Calendar'), { ssr: false });

export default function HomePage({ view }) {
  return view === 'table' ? <TableView /> : <Calendar />;
}
