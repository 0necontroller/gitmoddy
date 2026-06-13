Examples The basics
The simplest resizable panel configuration is two panels within a group.
import { Group, Panel } from "react-resizable-panels";

<Group>
  <Panel>left</Panel>
  <Panel>right</Panel>
</Group>
left
right
Panel groups use a flexbox layout with a default orientation of horizontal but the orientation prop can be used to specify a vertical layout.
<Group className="min-h-30" orientation="vertical">
  <Panel>top</Panel>
  <Panel>bottom</Panel>
</Group>
Vertical groups may benefit from an explicit height or min-height (read more).
top
bottom
Panels can be resized by clicking on their borders but explicit separators can be rendered to improve UX. Separators provide another benefit: double-clicking on one resets a panel to its default size.
left
right
<Group>
  <Panel defaultSize="50%">left</Panel>
  <Separator />
  <Panel>right</Panel>
</Group>
Separators improve keyboard accessibility by providing a tab-focusable window splitter element.
