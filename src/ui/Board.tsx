import { BOARD_HEIGHT, BOARD_WIDTH, CELL_PX, getCatalogItem } from "../catalog";
import type { Action, BoardPiece, CatalogId, SyncStatus } from "../rules/types";
import { canWrite } from "./canWrite";
import { pieceStyle } from "./pieceStyle";

export function Board({
  pieces,
  sync,
  dispatch,
}: {
  pieces: BoardPiece[];
  sync: SyncStatus;
  dispatch: (action: Action) => Promise<unknown>;
}) {
  const locked = !canWrite(sync);
  return (
    <div
      className="board"
      style={{ width: BOARD_WIDTH * CELL_PX, height: BOARD_HEIGHT * CELL_PX }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (locked) return;
        const catalogId = event.dataTransfer.getData("text/plain") as CatalogId;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / CELL_PX);
        const y = Math.floor((event.clientY - rect.top) / CELL_PX);
        void dispatch({
          type: "place",
          id: crypto.randomUUID(),
          catalogId,
          x,
          y,
          rotation: 0,
          at: new Date().toISOString(),
        });
      }}
    >
      {pieces.map((piece) => {
        const box = pieceStyle(piece.catalogId, piece.x, piece.y, piece.rotation, CELL_PX);
        return (
          <button
            key={piece.id}
            type="button"
            className={`piece piece-${piece.catalogId}`}
            style={{
              position: "absolute",
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }}
            disabled={locked}
            title={locked ? undefined : "Click to pick up"}
            onClick={() => void dispatch({ type: "pickUp", id: piece.id })}
          >
            {getCatalogItem(piece.catalogId).name}
          </button>
        );
      })}
    </div>
  );
}
