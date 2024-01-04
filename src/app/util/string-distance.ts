enum AdjustmentType {
    Insert,
    Delete,
    Swap
}

interface Adjustment {
    pos: number, 
    type: AdjustmentType
}

export function MeasureStringDistance(source: string, target: string): number {
    return RescurseAdjustments(source, 0, target, 0, [], Number.MAX_SAFE_INTEGER).length;
}

function RescurseAdjustments(currentSource: string, currentSourcePos: number, target: string, targetPos: number, currentAdjustments: Adjustment[], minAdjustmentLength: number): Adjustment[] {
    // Completed branch -- either correct or exceeds current longest branch
    if (currentSource === target || currentAdjustments.length > minAdjustmentLength)
    {
        return currentAdjustments;
    }

    // Current character is correct, step forward
    if (currentSource.length > currentSourcePos 
        && target.length > targetPos
        && currentSource[currentSourcePos] === target[targetPos])
    {
        return RescurseAdjustments(currentSource, currentSourcePos + 1, target, targetPos + 1, currentAdjustments, minAdjustmentLength);
    }

    let newMinLength = Number.MAX_SAFE_INTEGER;
    let shortestPath: Adjustment[] = [];

    // Swap
    if (targetPos + 1 < target.length 
        && currentSourcePos + 1 < currentSource.length 
        && currentSource[currentSourcePos] == target[targetPos + 1] 
        && currentSource[currentSourcePos+1] == target[targetPos])
    {
        shortestPath = Swap(currentSource, currentSourcePos, target, targetPos, currentAdjustments, newMinLength);
        newMinLength = shortestPath.length;
    }        

    // Insert
    if (targetPos < target.length) {
        const adjustments: Adjustment[] = Insert(currentSource, currentSourcePos, target, targetPos, currentAdjustments, newMinLength);
        if (adjustments.length < newMinLength) {
            shortestPath = adjustments;
            newMinLength = adjustments.length;
        }
    }

    // Delete
    if (currentSourcePos < currentSource.length) {
        const adjustments: Adjustment[] = Delete(currentSource, currentSourcePos, target, targetPos, currentAdjustments, newMinLength);
        if (adjustments.length < newMinLength) {
            shortestPath = adjustments;
            newMinLength = adjustments.length;
        }
    }

    return shortestPath;
}

function Swap(currentSource: string, currentSourcePos: number, target: string, targetPos: number, currentAdjustments: Adjustment[], minAdjustmentLength: number): Adjustment[] {
    let newCurrentSource: string = currentSource.substring(0, currentSourcePos) + currentSource[currentSourcePos + 1] + currentSource[currentSourcePos];
    if (currentSource.length > currentSourcePos + 2)
    {
        newCurrentSource = newCurrentSource + currentSource.substring(currentSourcePos + 2);
    }

    let newAdjustments: Adjustment[] = [...currentAdjustments];
    newAdjustments.push({ pos: currentSourcePos, type: AdjustmentType.Swap });

    return RescurseAdjustments(newCurrentSource, currentSourcePos + 2, target, targetPos + 2, newAdjustments, minAdjustmentLength);
}

function Insert(currentSource: string, currentSourcePos: number, target: string, targetPos: number, currentAdjustments: Adjustment[], minAdjustmentLength: number): Adjustment[] {
    const newCurrentSource: string = currentSource.substring(0, currentSourcePos) + target[targetPos] + currentSource.substring(currentSourcePos);

    let newAdjustments: Adjustment[] = [...currentAdjustments];
    newAdjustments.push({ pos: currentSourcePos, type: AdjustmentType.Insert });

    return RescurseAdjustments(newCurrentSource, currentSourcePos + 1, target, targetPos + 1, newAdjustments, minAdjustmentLength);
}

function Delete(currentSource: string, currentSourcePos: number, target: string, targetPos: number, currentAdjustments: Adjustment[], minAdjustmentLength: number): Adjustment[] {
    const newCurrentSource: string = currentSource.substring(0, currentSourcePos) + currentSource.substring(currentSourcePos + 1);

    let newAdjustments: Adjustment[] = [...currentAdjustments];
    newAdjustments.push({ pos: currentSourcePos, type: AdjustmentType.Delete });

    return RescurseAdjustments(newCurrentSource, currentSourcePos, target, targetPos, newAdjustments, minAdjustmentLength);
}