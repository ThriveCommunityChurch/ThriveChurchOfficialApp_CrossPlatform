//
//  ThriveChurchOfficialAppUITestsLaunchTests.swift
//  ThriveChurchOfficialAppUITests
//
//  Launch performance tests for Thrive Church Official App
//

import XCTest

final class ThriveChurchOfficialAppUITestsLaunchTests: XCTestCase {
    
    override class var runsForEachTargetApplicationUIConfiguration: Bool {
        true
    }
    
    override func setUpWithError() throws {
        continueAfterFailure = false
    }
    
    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Take a screenshot of the launch screen
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Launch Screen"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

