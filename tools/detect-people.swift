// Face/person detector over Apple's Vision framework — no third-party deps.
// Prints one TSV line per image: path <tab> faces <tab> persons
//
// Photos pulled from a Google listing regularly contain customers and staff
// who never agreed to appear on a commercial website. Faces alone are not
// enough (people turn away from the camera), so human-body detection runs
// too and either hit disqualifies the image.

import Foundation
import Vision
import AppKit

let paths = Array(CommandLine.arguments.dropFirst())
if paths.isEmpty {
    FileHandle.standardError.write("usage: detect-people <image>...\n".data(using: .utf8)!)
    exit(2)
}

for path in paths {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("\(path)\t-1\t-1")
        continue
    }
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    let faceReq = VNDetectFaceRectanglesRequest()
    let bodyReq = VNDetectHumanRectanglesRequest()
    do {
        try handler.perform([faceReq, bodyReq])
    } catch {
        print("\(path)\t-1\t-1")
        continue
    }
    let faces = faceReq.results?.count ?? 0
    // Low-confidence body boxes fire on mannequins and posters; require some
    // confidence before rejecting an otherwise usable shot.
    let bodies = (bodyReq.results ?? []).filter { $0.confidence >= 0.5 }.count
    print("\(path)\t\(faces)\t\(bodies)")
}
