
# Convert Servers Sidebar to Configuration Tab

## Overview
Transform the current two-panel layout (sidebar + main content) into a single unified tabbed interface. Servers will become a "Configuration" tab alongside Channels, Processes, Logs, and Diagnostics.

## Current vs New Layout

```text
CURRENT LAYOUT:
┌─────────────────────────────────────────────┐
│ Header                                       │
├──────────────┬──────────────────────────────┤
│  Servers     │  [Channels|Processes|Logs|...│
│  Sidebar     │                              │
│  (fixed)     │       Tab Content            │
│              │                              │
└──────────────┴──────────────────────────────┘

NEW LAYOUT:
┌─────────────────────────────────────────────┐
│ Header (optional - can be removed later)     │
├─────────────────────────────────────────────┤
│ [Servers|Channels|Processes|Logs|Diagnostics]│
├─────────────────────────────────────────────┤
│                                             │
│              Tab Content                     │
│                                             │
└─────────────────────────────────────────────┘
```

## Implementation Details

### 1. Restructure Dashboard.tsx Layout
- Remove the fixed left sidebar (`<aside>`)
- Move Servers tab trigger into the main TabsList
- Add a new "Servers" tab that shows server selection/management
- Keep server selection state to filter channels/logs appropriately

### 2. New "Servers" Tab Content
Create a new TabsContent for servers that includes:
- Server cards in a responsive grid layout (similar to channels)
- Add Server dialog button
- Server selection with visual indicator
- Quick access to server token

### 3. Update Tab Navigation Flow
- **Servers tab**: Select/manage servers (like current sidebar)
- **Channels tab**: Shows channels for selected server
- **Processes tab**: Shows running processes for selected server
- **Logs tab**: Shows logs for selected server
- **Diagnostics tab**: Shows diagnostic commands

### 4. Server Selection Indicator
When a server is selected, show an indicator in the header area or as a persistent badge so users know which server context they're viewing.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Remove sidebar, add Servers tab, restructure layout |

## Technical Implementation

```typescript
// New tab structure in Dashboard.tsx
<Tabs defaultValue="servers" className="flex h-full flex-col">
  <div className="border-b px-6 py-3">
    <div className="flex items-center justify-between">
      {/* Selected server indicator */}
      {currentSelectedServer && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentSelectedServer.name}</Badge>
          <span className="text-sm text-muted-foreground">
            {channels.length} channels
          </span>
        </div>
      )}
      
      <TabsList>
        <TabsTrigger value="servers">
          <ServerIcon /> Servers
        </TabsTrigger>
        <TabsTrigger value="channels" disabled={!currentSelectedServer}>
          <Radio /> Channels
        </TabsTrigger>
        <TabsTrigger value="processes" disabled={!currentSelectedServer}>
          <Activity /> Processes
        </TabsTrigger>
        <TabsTrigger value="logs" disabled={!currentSelectedServer}>
          <ScrollText /> Logs
        </TabsTrigger>
        <TabsTrigger value="diagnostics" disabled={!currentSelectedServer}>
          <Terminal /> Diagnostics
        </TabsTrigger>
      </TabsList>
    </div>
  </div>

  {/* Servers Tab - replaces sidebar */}
  <TabsContent value="servers">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {servers.map(server => (
        <ServerCard 
          key={server.id}
          server={server}
          onSelect={() => {
            setSelectedServer(server);
            // Auto-switch to channels tab after selection
          }}
        />
      ))}
    </div>
  </TabsContent>

  {/* Other tabs remain similar */}
</Tabs>
```

## UX Considerations

1. **Auto-navigate**: When selecting a server in the Servers tab, automatically switch to Channels tab
2. **Disabled states**: Disable Channels/Processes/Logs/Diagnostics tabs when no server is selected
3. **Selected server badge**: Show the selected server name persistently so users always know their context
4. **Empty state**: Guide users to select a server first if they try to access other tabs without selection

## Benefits for Future Embedding

- Single container with no fixed sidebars
- Full-width layout works better in iframes or embedded contexts
- Tab-based navigation is more flexible for integration
- Header can easily be removed or replaced when embedding
