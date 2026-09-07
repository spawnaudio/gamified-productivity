import { BOARD_HEIGHT, BOARD_WIDTH, CELL_PX, getCatalogItem } from "../catalog";
import type { Action, BoardPiece, SyncStatus } from "../rules/types";
import { dropPlaceAction } from "./boardDrop";
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
        const rect = event.currentTarget.getBoundingClientRect();
        const action = dropPlaceAction(
          event.dataTransfer.getData("text/plain"),
          Math.floor((event.clientX - rect.left) / CELL_PX),
          Math.floor((event.clientY - rect.top) / CELL_PX),
          crypto.randomUUID(),
          new Date().toISOString(),
        );
        if (!action) return;
        void dispatch(action);
      }}
    >
      {pieces.map((piece) => {
        const box = pieceStyle(piece.catalogId, piece.x, piece.y, piece.rotation, CELL_PX);
        const item = getCatalogItem(piece.catalogId);
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
            onClick={() => void dispatch({ type: "pickUp", id: piece.id })}
          >
            {item?.name}
          </button>
        );
      })}
    </div>
  );
}
