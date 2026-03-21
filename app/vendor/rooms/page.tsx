"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, X, BedDouble, ToggleLeft, ToggleRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/providers/ToastContext";

const ROOM_TYPES = ["SINGLE","DOUBLE","TWIN","DELUXE","SUITE","PENTHOUSE","DORMITORY"] as const;

const roomSchema = z.object({
  name:          z.string().min(2, "Room name required"),
  type:          z.enum(ROOM_TYPES),
  pricePerNight: z.coerce.number().positive("Must be positive"),
  capacity:      z.coerce.number().int().min(1).max(20),
  floor:         z.coerce.number().int().min(0),
  totalRooms:    z.coerce.number().int().min(1),
  description:   z.string().optional(),
  amenities:     z.string().optional(),
});
type RoomForm = z.infer<typeof roomSchema>;

type Room = RoomForm & { id: string; status: string; isActive: boolean; images: string[]; _count: { bookings: number } };

const TYPE_COLORS: Record<string, string> = {
  SINGLE:"bg-slate-100 text-slate-700", DOUBLE:"bg-blue-100 text-blue-700",
  TWIN:"bg-cyan-100 text-cyan-700",     DELUXE:"bg-amber-100 text-amber-700",
  SUITE:"bg-purple-100 text-purple-700",PENTHOUSE:"bg-rose-100 text-rose-700",
  DORMITORY:"bg-green-100 text-green-700",
};

function RoomSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="flex gap-2 mt-2">
          <div className="flex-1 h-8 bg-slate-100 rounded" />
          <div className="flex-1 h-8 bg-red-50 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function VendorRoomsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [saving, setSaving]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<RoomForm>({ resolver: zodResolver(roomSchema) });

  const fetchRooms = async () => {
    const res  = await fetch("/api/vendor/rooms");
    const data = await res.json();
    if (data.success) setRooms(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => {
    setEditRoom(null);
    reset({ type: "DOUBLE", capacity: 2, floor: 1, totalRooms: 1 });
    setShowModal(true);
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    reset({
      name: room.name, type: room.type as any, pricePerNight: room.pricePerNight,
      capacity: room.capacity, floor: room.floor, totalRooms: room.totalRooms,
      description: room.description || "",
      amenities: (room.amenities as any as string[]).join(", "),
    });
    setShowModal(true);
  };

  const onSubmit = async (data: RoomForm) => {
    setSaving(true);
    const payload = {
      ...data,
      amenities: data.amenities ? data.amenities.split(",").map(a => a.trim()).filter(Boolean) : [],
    };
    const url    = editRoom ? `/api/vendor/rooms/${editRoom.id}` : "/api/vendor/rooms";
    const method = editRoom ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json   = await res.json();
    setSaving(false);
    if (!json.success) { toastError(json.error); return; }
    toastSuccess(editRoom ? "Room updated" : "Room created");
    setShowModal(false);
    fetchRooms();
  };

  const toggleActive = async (room: Room) => {
    const res  = await fetch(`/api/vendor/rooms/${room.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !room.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      toastSuccess(room.isActive ? "Room deactivated" : "Room activated");
      fetchRooms();
    } else toastError(data.error);
  };

  const deleteRoom = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    setDeleting(id);
    const res  = await fetch(`/api/vendor/rooms/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(null);
    if (data.success) { toastSuccess("Room deleted"); fetchRooms(); }
    else toastError(data.error);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Room Management</h1>
            <p className="text-slate-500 mt-1 text-sm">{rooms.length} room{rooms.length !== 1 ? "s" : ""} configured</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" />Add Room
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i=><RoomSkeleton key={i}/>)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No rooms yet. Add your first room to start accepting bookings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map(room => (
              <div key={room.id} className={`bg-white rounded-2xl border overflow-hidden ${room.isActive ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[room.type]}`}>{room.type}</span>
                        {!room.isActive && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <h3 className="font-bold text-slate-800">{room.name}</h3>
                      <p className="text-xs text-slate-400">Floor {room.floor} · Max {room.capacity} guests · {room.totalRooms} unit{room.totalRooms > 1 ? "s" : ""}</p>
                    </div>
                    <button onClick={() => toggleActive(room)} className="text-slate-400 hover:text-slate-600">
                      {room.isActive
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                    </button>
                  </div>
                  <p className="text-xl font-bold text-amber-600 mb-1">NPR {room.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-slate-400">/night</span></p>
                  <p className="text-xs text-slate-400 mb-4">{room._count.bookings} total bookings</p>

                  <div className="flex gap-2 pt-3 border-t border-slate-50">
                    <button onClick={() => openEdit(room)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </button>
                    {confirmDelete === room.id ? (
                      <div className="flex-1 flex items-center justify-center gap-1.5">
                        <button onClick={() => deleteRoom(room.id)} disabled={deleting === room.id}
                          className="flex-1 text-xs py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                          {deleting === room.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Delete"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="flex-1 text-xs py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50">
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => deleteRoom(room.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">{editRoom ? `Edit ${editRoom.name}` : "Add New Room"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Room Name</label>
                  <input {...register("name")} placeholder="e.g. Deluxe Mountain View" className={inputCls} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type</label>
                  <select {...register("type")} className={inputCls}>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Price / Night (NPR)</label>
                  <input {...register("pricePerNight")} type="number" placeholder="3500" className={inputCls} />
                  {errors.pricePerNight && <p className="mt-1 text-xs text-red-600">{errors.pricePerNight.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Floor</label>
                  <input {...register("floor")} type="number" placeholder="1" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Max Capacity</label>
                  <input {...register("capacity")} type="number" placeholder="2" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Total Units</label>
                  <input {...register("totalRooms")} type="number" placeholder="1" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Amenities <span className="font-normal normal-case text-slate-400">(comma separated)</span>
                </label>
                <input {...register("amenities")} placeholder="WiFi, AC, TV, Hot Water, Minibar" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea {...register("description")} rows={3} placeholder="Describe this room…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editRoom ? "Save Changes" : "Create Room"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
