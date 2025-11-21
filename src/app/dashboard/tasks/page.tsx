'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const unattendedTasks = [
  {
    tableName: 'Table 5',
    requestType: 'Refill Water',
    dateTime: '2023-10-27 10:30 AM',
  },
  {
    tableName: 'Table 2',
    requestType: 'Bill Please',
    dateTime: '2023-10-27 10:28 AM',
  },
  {
    tableName: 'Table 8',
    requestType: 'Clean Table',
    dateTime: '2023-10-27 10:25 AM',
  },
  {
    tableName: 'Table 3',
    requestType: 'Extra Napkins',
    dateTime: '2023-10-27 10:22 AM',
  },
];

// Expanded task history data for pagination
const taskHistory = Array.from({ length: 55 }, (_, i) => {
    const statusTypes = ['attended', 'ignored', 'unattended'] as const;
    const requestTypes = ['Refill Water', 'Bill Please', 'Clean Table', 'Extra Napkins'];
    const staffNames = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Emily White'];
    const status = statusTypes[i % statusTypes.length];
    return {
        taskCount: 101 + i,
        dateTime: `2023-10-27 ${10 - Math.floor(i/60)}:${(59 - (i % 60)).toString().padStart(2, '0')} AM`,
        tableNumber: `Table ${ (i % 12) + 1 }`,
        requestType: requestTypes[i % requestTypes.length],
        status: status,
        staff: status === 'attended' ? staffNames[i % staffNames.length] : '-',
    };
});


const statusVariant = (status: string) => {
  switch (status) {
    case 'attended':
      return 'default';
    case 'ignored':
      return 'destructive';
    case 'unattended':
      return 'secondary';
    default:
      return 'outline';
  }
};

const ITEMS_PER_PAGE = 10;

export default function TasksPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(taskHistory.length / ITEMS_PER_PAGE);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return taskHistory.slice(startIndex, endIndex);
  }, [currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tasks</h1>

      <Card>
        <CardHeader>
          <CardTitle>Unattended Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              {unattendedTasks.map((task, index) => (
                <Card key={index} className="w-[280px]">
                  <CardHeader>
                    <CardTitle className="text-lg">{task.tableName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-semibold">{task.requestType}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.dateTime}
                    </p>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline">Ignore</Button>
                      <Button>Attend</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task #</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Table Number</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Staff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.map((task) => (
                <TableRow key={task.taskCount}>
                  <TableCell>{task.taskCount}</TableCell>
                  <TableCell>{task.dateTime}</TableCell>
                  <TableCell>{task.tableNumber}</TableCell>
                  <TableCell>{task.requestType}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant(task.status)}
                      className="capitalize"
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.staff}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
