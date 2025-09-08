import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NominationContainerProps {
  nominations: string[];
}

export default function NominationContainer({
  nominations,
}: NominationContainerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nominees</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 lg:h-96">
          {nominations && nominations.length ? (
            <ul className="space-y-2">
              {nominations.map((nominee, index) => (
                <li
                  key={index}
                  className="text-lg p-2 border-2 rounded-3xl text-center
                  hover:bg-muted hover:text-muted-foreground"
                >
                  {nominee}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">No nominees yet</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
