import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db"
import { searchRelevantNotes } from "@/lib/vector-search" 

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query")

    if (!token || token.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let notes;

    if (query && query.trim() !== "") {
      const searchResults = await searchRelevantNotes(query, token.id as string, 15);
      const noteIds = searchResults.map(res => res.noteId);

      notes = await prisma.studentNote.findMany({
        where: {
          id: { in: noteIds },
          studentId: token.id as string,
        }
      });

      notes = notes.sort((a, b) => noteIds.indexOf(a.id) - noteIds.indexOf(b.id));
    } else {
      notes = await prisma.studentNote.findMany({
        where: { studentId: token.id as string },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}