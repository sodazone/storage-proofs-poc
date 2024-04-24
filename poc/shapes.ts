import * as $ from "subshape";

export function fromHexString(v: string): number[] {
  return Array.from(new Uint8Array(Buffer.from(v.substring(2), "hex")));
}

export function toHexString(v: number[]) {
  return `0x${Buffer.from(new Uint8Array(v)).toString("hex")}`;
}

export const $head = $.object(
  $.field("parentBlockHash", $.sizedArray($.u8, 32)),
  $.field("blockNumber", $.compact($.u64)),
  $.field("stateRoot", $.sizedArray($.u8, 32)),
);

export function decodeHeadData(data: number[]) {
  return $head.decode(new Uint8Array(data.slice(2)));
}
