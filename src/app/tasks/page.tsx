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
import { Separator } from '@/components/ui/separator';

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

const taskHistory = [
  {
    taskCount: 101,
    dateTime: '2023-10-27 10:20 AM',
    tableNumber: 'Table 1',
    requestType: 'Refill Water',
    status: 'attended',
    staff: 'John Doe',
  },
  {
    taskCount: 102,
    dateTime: '2023-10-27 10:15 AM',
    tableNumber: 'Table 7',
    requestType: 'Bill Please',
    status: 'ignored',
    staff: 'Jane Smith',
  },
  {
    taskCount: 103,
    dateTime: '2023-10-27 10:10 AM',
    tableNumber: 'Table 4',
    requestType: 'Clean Table',
    status: 'attended',
    staff: 'John Doe',
  },
  {
    taskCount: 104,
    dateTime: '2023-10-27 10:05 AM',
    tableNumber: 'Table 5',
    requestType: 'Extra Napkins',
    status: 'unattended',
    staff: '-',
  },
];

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

export default function TasksPage() {
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
                    <p className="text-sm text-muted-foreground">{task.dateTime}</p>
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
              {taskHistory.map((task) => (
                <TableRow key={task.taskCount}>
                  <TableCell>{task.taskCount}</TableCell>
                  <TableCell>{task.dateTime}</TableCell>
                  <TableCell>{task.tableNumber}</TableCell>
                  <TableCell>{task.requestType}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(task.status)} className="capitalize">
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.staff}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
