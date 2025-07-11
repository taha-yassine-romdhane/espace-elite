import React from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { User } from "../index";

export const columns = (
  handleEdit: (user: User) => void,
  handleDelete: (id: string) => void
): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "telephone",
    header: "Telephone",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
          {user.role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Badge
          variant={user.isActive ? "default" : "secondary"}
          className={user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
        >
          {user.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleEdit(user)}
            title="Modifier l'utilisateur"
            className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              console.log('Delete button clicked for user:', user.id);
              handleDelete(user.id);
            }}
            title="Supprimer l'utilisateur"
            className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      );
    },
  },
];

// This is not a page, but Next.js requires a default export
// for any file in the pages directory.
const ColumnsPage = () => null;
export default ColumnsPage;
