import serial
import serial.tools.list_ports
ports=list(serial.tools.list_ports.comports())

for p in ports:
    if p.serial_number == '85138313733351106162':
        ser = serial.Serial(p.device, 9600)
        print(p.device)
        break
if ser==None:
    print("No serial device found for required serial number")
        
