import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface ContentColumnProps {
  title: string;
  className?: string;
  items: {
    title: string;
    description: string;
  }[];
}

export function ContentColumn({ title, className, items }: ContentColumnProps) {
  return (
    <section className={cn("flex-1", className)}>
      <ScrollArea className="h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-headline font-bold text-primary mb-8">{title}</h1>
          <div className="space-y-6">
            {items.map((item, index) => (
              <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}
