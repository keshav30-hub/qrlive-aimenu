import { ContentColumn } from '@/components/content-column';

const menuItems = [
  { title: "Espresso", description: "A concentrated coffee beverage brewed by forcing a small amount of nearly boiling water under pressure through finely-ground coffee beans." },
  { title: "Latte", description: "A coffee drink made with espresso and steamed milk. The term as used in English is a shortened form of the Italian caffè latte." },
  { title: "Cappuccino", description: "An espresso-based coffee drink that originated in Italy, and is traditionally prepared with steamed milk foam." },
  { title: "Americano", description: "A type of coffee drink prepared by diluting an espresso with hot water, giving it a similar strength to, but different flavor from, traditionally brewed coffee." },
  { title: "Macchiato", description: "An espresso coffee drink with a small amount of milk, usually foamed. In Italian, macchiato means 'stained' or 'spotted'." },
  { title: "Mocha", description: "A chocolate-flavoured variant of a caffè latte. Other commonly used spellings are mochaccino and also café mocha." },
  { title: "Flat White", description: "A coffee drink consisting of espresso with microfoam (steamed milk with small, fine bubbles and a glossy or velvety consistency)." },
  { title: "Iced Coffee", description: "Coffee that has been brewed and then chilled. It is often served with milk, sugar, or other flavorings." },
  { title: "Cold Brew", description: "Coffee that is steeped in cold water for an extended period, typically 12 to 24 hours. The result is a smooth, low-acid coffee concentrate." },
  { title: "Pour Over", description: "A method of brewing coffee that involves pouring hot water over coffee grounds in a filter. The water drains through the coffee and filter into a carafe or mug." },
];

const orderDetails = [
  { title: "Order #1234", description: "1x Latte, 2x Cappuccino. Total: $12.50. Status: Preparing." },
  { title: "Order #1235", description: "1x Americano. Total: $3.50. Status: Ready for pickup." },
  { title: "Order #1236", description: "1x Espresso, 1x Mocha. Total: $7.00. Status: Delivered." },
  { title: "Order #1237", description: "3x Iced Coffee. Total: $10.50. Status: Preparing." },
  { title: "Order #1238", description: "1x Cold Brew. Total: $4.50. Status: Ready for pickup." },
  { title: "Order #1239", description: "2x Flat White. Total: $9.00. Status: Preparing." },
  { title: "Order #1240", description: "1x Macchiato. Total: $3.75. Status: Delivered." },
  { title: "Order #1241", description: "1x Pour Over. Total: $5.00. Status: Ready for pickup." },
  { title: "Order #1242", description: "1x Espresso. Total: $3.00. Status: Preparing." },
  { title: "Order #1243", description: "2x Latte. Total: $9.00. Status: Delivered." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <ContentColumn title="Live Menu" items={menuItems} className="bg-background" />
      <ContentColumn title="Order Queue" items={orderDetails} className="bg-muted" />
    </main>
  );
}
