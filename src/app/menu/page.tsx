'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrency } from '@/hooks/use-currency';


type Addon = { name: string; price: string };
type Modifier = { name: string; price: string };

const initialItemState = {
  name: '',
  ingredients: '',
  description: '',
  mrp: '',
  type: 'veg',
  addons: [{ name: '', price: '' }],
  modifiers: [{ name: '', price: '' }],
};

const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
];

export default function MenuPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialItemState);
  const { format } = useCurrency();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (value: string) => {
    setNewItem(prev => ({ ...prev, type: value }));
  };

  const handleAddonChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const addons = [...newItem.addons];
    addons[index] = { ...addons[index], [name]: value };
    setNewItem(prev => ({ ...prev, addons }));
  };

  const handleModifierChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const modifiers = [...newItem.modifiers];
    modifiers[index] = { ...modifiers[index], [name]: value };
    setNewItem(prev => ({ ...prev, modifiers }));
  };

  const addAddonField = () => {
    setNewItem(prev => ({ ...prev, addons: [...prev.addons, { name: '', price: '' }] }));
  };

  const addModifierField = () => {
    setNewItem(prev => ({ ...prev, modifiers: [...prev.modifiers, { name: '', price: '' }] }));
  };
  
  const removeAddonField = (index: number) => {
    const addons = [...newItem.addons];
    addons.splice(index, 1);
    setNewItem(prev => ({ ...prev, addons }));
  };

  const removeModifierField = (index: number) => {
    const modifiers = [...newItem.modifiers];
    modifiers.splice(index, 1);
    setNewItem(prev => ({ ...prev, modifiers }));
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Menu Management</h1>
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="combo">Combo</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <div className="flex justify-end">
             <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" /> Add Item
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Add New Menu Item</SheetTitle>
                  <SheetDescription>
                    Fill in the details below to add a new item to your menu.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-120px)] pr-4">
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-image">Item Image</Label>
                      <Input id="item-image" type="file" />
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 400x300 pixels for best fit on mobile.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input id="name" name="name" value={newItem.name} onChange={handleInputChange} placeholder="e.g. Classic Burger" />
                    </div>
                     <div className="space-y-2">
                      <Label>Type</Label>
                       <RadioGroup
                        defaultValue="veg"
                        className="flex gap-4"
                        onValueChange={handleRadioChange}
                        value={newItem.type}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="veg" id="veg" />
                          <Label htmlFor="veg" className="font-normal">Veg</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non-veg" id="non-veg" />
                          <Label htmlFor="non-veg" className="font-normal">Non-Veg</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ingredients">Ingredients</Label>
                      <Textarea id="ingredients" name="ingredients" value={newItem.ingredients} onChange={handleInputChange} placeholder="e.g. Patty, Lettuce, Tomato, Cheese" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" value={newItem.description} onChange={handleInputChange} placeholder="Describe the item..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mrp">MRP ({format(0).substring(0,1)})</Label>
                        <Input id="mrp" name="mrp" type="number" value={newItem.mrp} onChange={handleInputChange} placeholder="e.g. 150" />
                    </div>
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="add-ons">
                        <AccordionTrigger>Add-ons</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {newItem.addons.map((addon, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`addon-name-${index}`}>Name</Label>
                                <Input id={`addon-name-${index}`} name="name" value={addon.name} onChange={(e) => handleAddonChange(index, e)} placeholder="e.g. Extra Cheese" />
                              </div>
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`addon-price-${index}`}>Price</Label>
                                <Input id={`addon-price-${index}`} name="price" type="number" value={addon.price} onChange={(e) => handleAddonChange(index, e)} placeholder="e.g. 30" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeAddonField(index)} disabled={newItem.addons.length === 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addAddonField} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="modifiers">
                        <AccordionTrigger>Modifiers</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {newItem.modifiers.map((modifier, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`modifier-name-${index}`}>Name</Label>
                                <Input id={`modifier-name-${index}`} name="name" value={modifier.name} onChange={(e) => handleModifierChange(index, e)} placeholder="e.g. Small" />
                              </div>
                              <div className="grid w-full gap-2">
                                <Label htmlFor={`modifier-price-${index}`}>Price</Label>
                                <Input id={`modifier-price-${index}`} name="price" type="number" value={modifier.price} onChange={(e) => handleModifierChange(index, e)} placeholder="e.g. 90" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeModifierField(index)} disabled={newItem.modifiers.length === 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addModifierField} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </ScrollArea>
                <SheetFooter>
                  <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                  <Button onClick={() => { /* Handle Save */ setIsSheetOpen(false); }}>Save Item</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          {/* Item listing will go here */}
          <div className="mt-4 text-center text-muted-foreground">
            <p>No items have been added yet.</p>
          </div>
        </TabsContent>
        <TabsContent value="category">
           <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new menu category.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input id="category-name" placeholder="e.g. Appetizers" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-image">Category Image</Label>
                    <Input id="category-image" type="file" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description">Description (Optional)</Label>
                    <Textarea id="category-description" placeholder="Describe the category..." />
                  </div>
                  <div className="space-y-3">
                    <Label>Available Days of Week</Label>
                    <div className="grid grid-cols-3 gap-2 rounded-md border p-4">
                        {daysOfWeek.map((day) => (
                            <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox id={day.id} />
                                <Label htmlFor={day.id} className="font-normal text-sm">{day.label}</Label>
                            </div>
                        ))}
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label>Available Duration</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="from-time" className="text-xs">From</Label>
                        <Input id="from-time" type="time" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to-time" className="text-xs">To</Label>
                        <Input id="to-time" type="time" />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-4 text-center text-muted-foreground">
            <p>No categories have been added yet.</p>
          </div>
        </TabsContent>
        <TabsContent value="combo">
          <div className="mt-4 text-center text-muted-foreground">
            <p>Combo offer management will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
