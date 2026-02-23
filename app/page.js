'use client';

import { useContext } from 'react';
import dynamic from 'next/dynamic';
import TableView from '@/components/TableView';
import { ViewContext } from '@/context/ViewContext';

const Calendar = dynamic(() => import('@/components/Calendar'), { ssr: false });

export default function HomePage() {
  const { view } = useContext(ViewContext);
  return view === 'table' ? <TableView /> : <Calendar />;
}
