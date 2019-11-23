from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException


def wait_for_load_screen(driver):
    try:
        print("wait")
        # then wait for the element to disappear
        WebDriverWait(driver, 30).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, "loading-overlay")))

    except TimeoutException:
        # if timeout exception was raised - it may be safe to
        # assume loading has finished, however this may not
        # always be the case, use with caution, otherwise handle
        # appropriately.
        print("Reloading screen is being an asshole")


f = open("course_num.txt", "w")

term_urls = ['1204', '1202', '1198', '1196', '1194', '1192', '1188', '1186', '1184', '1182', '1178']
school_count = [32, 20, 35, 31, 34, 19, 35, 31, 35, 15, 36]

driver = webdriver.Chrome()
driver.get("https://m.albert.nyu.edu/app/catalog/classSearch/1204")
delay = 5 # seconds
reload_delay = 10

try:
    for i in range(4, 32):
        driver.refresh()
        myElem = WebDriverWait(driver, delay).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'div.btn-group > .dropdown-toggle')))
        drop_downs = driver.find_elements_by_css_selector('div.btn-group > .dropdown-toggle')
        school_sel = drop_downs[1]
        sub_sel = drop_downs[2]
        school_sel.click()
        # click to drop down all schools
        school_drop_down = driver.find_elements_by_css_selector('div.bs-container > div.dropdown-menu > ul > li > a')
        # get all the selection buttons
        school_drop_down[i].click()
        # click each selection button
            # print("open sub first time")
        school_sel = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@data-id='subject']")))
        sub_sel.click()
        # click to open the subject drop down
        sub_drop_down = driver.find_elements_by_css_selector('div.bs-container > div.dropdown-menu > ul > li > a')
        # click to get the length of all subjects
            # print("close sub first time")
        sub_drop_down[0].click()
        # click to close the drop down to setup looping
        over_lay_count = 0
        over_lay_max = 10
        for j in range(1, len(sub_drop_down)):
            if over_lay_count >= over_lay_max:
                driver.refresh()
                myElem = WebDriverWait(driver, delay).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'div.btn-group > .dropdown-toggle')))
                drop_downs = driver.find_elements_by_css_selector('div.btn-group > .dropdown-toggle')
                school_sel = drop_downs[1]
                sub_sel = drop_downs[2]
                # print("open sub {time} time".format(time=j))

            sub_sel.click()
            # drop down subjects
            sub_drop_down = driver.find_elements_by_css_selector('div.bs-container > div.dropdown-menu > ul > li > a')
            # find all drop downs
                # print("click sub {time} time".format(time=j))
            sub_drop_down[j].click()
            search_btn = driver.find_element_by_id('buttonSearch')
            search_btn.click()
            try:
                myElem = WebDriverWait(driver, reload_delay).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'div.section-content > div.strong')))
                courses = driver.find_elements_by_css_selector('div.section-content > div.strong')
                for course in courses:
                    print(course.text)
                    f.write(course.text + ",")
                    wait_for_load_screen(driver)
            except TimeoutException:
                print("Reloading took too long")
            over_lay_count += 1
            # click each subject

except TimeoutException:
    print("Loading took too much time!")

f.close()
