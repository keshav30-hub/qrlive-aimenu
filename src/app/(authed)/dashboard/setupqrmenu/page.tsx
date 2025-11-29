
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Smartphone,
  BookCopy,
  PlusCircle,
  Download,
  ExternalLink,
  Trash2,
  Table as TableIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type TableData = {
  id: string;
  name: string;
}

type UserProfile = {
    businessId?: string;
}

type CategoryData = {
  id: string;
}

export default function SetupQrMenuPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const tablesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tables') : null, [firestore, user]);
  const categoriesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'menuCategories') : null, [firestore, user]);
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: tablesData, isLoading: tablesLoading } = useCollection<TableData>(tablesRef);
  const { data: categoriesData, isLoading: categoriesLoading } = useCollection<CategoryData>(categoriesRef);
  const { data: userProfile } = useDoc<UserProfile>(userRef);

  const tables = tablesData || [];

  const [newTableName, setNewTableName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const businessId = userProfile?.businessId;


  const handleAddTable = async () => {
    if (newTableName.trim() && tablesRef) {
      try {
        await addDoc(tablesRef, { name: newTableName });
        toast({ title: "Success", description: "Table added." });
        setNewTableName('');
        setIsDialogOpen(false);
      } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not add table." });
        console.error(e);
      }
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!tablesRef) return;
    try {
      await deleteDoc(doc(tablesRef, id));
      toast({ title: "Success", description: "Table deleted." });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete table." });
      console.error(e);
    }
  };
  
  const handleDownloadQr = (tableName: string) => {
    if (!businessId) {
        toast({ variant: "destructive", title: "Error", description: "Business ID not found." });
        return;
    }
    const tableSlug = tableName.toLowerCase().replace(/ /g, '-');
    const menuUrl = `${window.location.origin}/qrmenu/${businessId}/${tableSlug}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      menuUrl
    )}`;
    
    fetch(qrApiUrl)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${tableName.replace(/ /g, '_')}-qr-code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        window.open(qrApiUrl, '_blank');
      });
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">QR Menu Analytics & Management</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables Created</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tablesLoading ? (
              <div className="h-8 w-12 bg-gray-200 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold">{tables.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Number of unique QR codes generated.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Menu Categories
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {categoriesLoading ? (
              <div className="h-8 w-12 bg-gray-200 animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold">{categoriesData?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Number of categories in your menu.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Live analytics data not available</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Table Management</CardTitle>
            <CardDescription>
              Create and manage QR codes for your tables.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>
                  Enter a name for the new table to generate a unique QR code.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="table-name" className="text-right">
                    Table Name
                  </Label>
                  <Input
                    id="table-name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Table 1 or T1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTable}>Save Table</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {tablesLoading ? <p>Loading tables...</p> : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Table Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table, index) => (
                  <TableRow key={table.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadQr(table.name)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download QR
                      </Button>
                      <Link href={`/qrmenu/${businessId}/${table.name.toLowerCase().replace(/ /g, '-')}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit
                        </Button>
                      </Link>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteTable(table.id)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              {tables.length === 0 && !tablesLoading && (
                  <div className="text-center py-10 text-muted-foreground">
                      <p>No tables added yet. Click &quot;Add Table&quot; to get started.</p>
                  </div>
              )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
